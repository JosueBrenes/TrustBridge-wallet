import { useState } from 'react';
import { nativeWebauthnService } from '@/services/native-webauthn.service';
import { Keypair } from '@stellar/stellar-sdk';

export interface CreateWalletResult {
  status: string;
  token: string;
  walletAddress: string;
  userId: string;
  message: string;
}

export interface AuthenticateResult {
  token: string;
  walletAddress: string;
  userId: string;
  message: string;
}

// Helper function to get RP ID based on current domain
const getRpId = (): string => {
  if (typeof window === 'undefined') return 'localhost';
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  return hostname;
};

// Helper function to generate Stellar wallet from passkey credential
const generateWalletFromPasskey = async (
  credentialId: string, 
  rawId: string
): Promise<{ keypair: Keypair; address: string; secret: string }> => {
  // Use credential ID and raw ID as entropy for deterministic key generation
  const combinedData = new TextEncoder().encode(credentialId + rawId);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', combinedData);
  const entropy = new Uint8Array(hashBuffer);

  // Generate Stellar keypair from entropy
  const keypair = Keypair.fromRawEd25519Seed(Buffer.from(entropy));

  return {
    keypair,
    address: keypair.publicKey(),
    secret: keypair.secret()
  };
};

// Helper function to activate wallet on Stellar testnet using friendbot
const activateWalletOnTestnet = async (publicKey: string): Promise<boolean> => {
  try {
    // Use Stellar's friendbot to fund the account
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);

    if (response.ok) {
      return true;
    } else {
      console.warn('⚠️ Friendbot funding failed:', response.status);
      return false;
    }
  } catch {
    return false;
  }
};

// Helper function to create WebAuthn options locally
const createLocalPasskeyOptions = () => {
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userId = window.crypto.getRandomValues(new Uint8Array(16));

  // Convert to base64url strings
  const challengeB64 = btoa(String.fromCharCode(...challenge))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const userIdB64 = btoa(String.fromCharCode(...userId))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    challenge: challengeB64,
    rp: {
      name: 'TrustBridge Wallet',
      id: getRpId()
    },
    user: {
      id: userIdB64,
      name: `user_${userIdB64.slice(0, 8)}`,
      displayName: `User ${userIdB64.slice(0, 8)}`
    },
    pubKeyCredParams: [
      { type: 'public-key' as const, alg: -7 }, // ES256
      { type: 'public-key' as const, alg: -35 }, // ES384
      { type: 'public-key' as const, alg: -36 } // ES512
    ],
    timeout: 60000,
    attestation: 'none' as AttestationConveyancePreference,
    authenticatorSelection: {
      authenticatorAttachment: 'platform' as AuthenticatorAttachment,
      userVerification: 'preferred' as UserVerificationRequirement,
      residentKey: 'preferred' as ResidentKeyRequirement,
      requireResidentKey: false
    },
    excludeCredentials: []
  };
};

export const usePasskeyWallet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create new wallet with passkey - fully local
  const createWallet = async (): Promise<CreateWalletResult> => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Create local WebAuthn options
      const optionsJSON = createLocalPasskeyOptions();

      // Step 2: Create passkey using native WebAuthn
      const { rawResponse, credentialId } = await nativeWebauthnService.createPasskey({ optionsJSON });

      // Step 3: Generate Stellar wallet from passkey
      // Convert ArrayBuffer to base64url string
      const rawIdString = btoa(String.fromCharCode(...new Uint8Array(rawResponse.rawId)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const wallet = await generateWalletFromPasskey(credentialId, rawIdString);

      // Step 4: Activate wallet on testnet
      const activated = await activateWalletOnTestnet(wallet.address);
      if (activated) {
        console.log('✅ Wallet activated on testnet');
      }

      // Step 5: Store wallet info locally
      const userId = optionsJSON.user.id;
      const token = `local_passkey_${Date.now()}_${credentialId.slice(0, 8)}`;

      // Store wallet data for later use
      localStorage.setItem("passkeyWalletData", JSON.stringify({
        publicKey: wallet.address,
        secretKey: wallet.secret,
        credentialId: credentialId,
        rawId: Array.from(new Uint8Array(rawResponse.rawId)),
      }));

      // Store the credential mapping for future authentication
      localStorage.setItem('passkey_credential_id', credentialId);
      localStorage.setItem('passkey_user_id', userId);
      localStorage.setItem('stellar_address', wallet.address);
      localStorage.setItem('stellar_secret', wallet.secret);

      return {
        status: 'success',
        token,
        walletAddress: wallet.address,
        userId,
        message: 'Wallet created successfully with passkey authentication'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wallet creation failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate with existing passkey - fully local
  const authenticate = async (): Promise<AuthenticateResult> => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Check if we have stored passkey info
      const storedCredentialId = localStorage.getItem('passkey_credential_id');
      const storedUserId = localStorage.getItem('passkey_user_id');
      const storedAddress = localStorage.getItem('stellar_address');

      if (!storedCredentialId || !storedUserId || !storedAddress) {
        throw new Error('No passkeys found. Please create a new wallet first.');
      }

      // Step 2: Create local authentication options
      const challengeBytes = window.crypto.getRandomValues(new Uint8Array(32));
      const challenge = btoa(String.fromCharCode(...challengeBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const optionsJSON = {
        challenge,
        timeout: 60000,
        rpId: getRpId(),
        allowCredentials: [{
          type: 'public-key' as const,
          id: storedCredentialId
        }],
        userVerification: 'preferred' as UserVerificationRequirement
      };

      // Step 3: Authenticate with native passkey
      const { rawResponse } = await nativeWebauthnService.authenticateWithPasskey({ optionsJSON });

      // Step 4: Regenerate wallet from stored credential info
      // Convert ArrayBuffer to base64url string
      const rawIdString = btoa(String.fromCharCode(...new Uint8Array(rawResponse.rawId)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const wallet = await generateWalletFromPasskey(storedCredentialId, rawIdString);

      // Verify the address matches what we stored
      if (wallet.address !== storedAddress) {
        throw new Error('Wallet address mismatch. Authentication failed.');
      }

      const token = `local_passkey_${Date.now()}_${storedCredentialId.slice(0, 8)}`;

      return {
          walletAddress: wallet.address,
          token,
          userId: storedUserId,
          message: 'Authentication successful'
        };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createWallet,
    authenticate,
    isLoading,
    error,
  };
};