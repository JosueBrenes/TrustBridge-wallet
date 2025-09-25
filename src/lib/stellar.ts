import { Keypair, Networks, rpc, Horizon } from '@stellar/stellar-sdk';

const { Server } = Horizon;

export const STELLAR_CONFIG = {
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
};

// Soroban RPC server instance
export const server = new rpc.Server(STELLAR_CONFIG.sorobanRpcUrl);

// Horizon server instance
export const horizonServer = new Horizon.Server(STELLAR_CONFIG.horizonUrl);

// Generate a new random wallet
export function generateWallet() {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
    keypair
  };
}

// Get keypair from secret key
export function getKeypairFromSecret(secretKey: string) {
  return Keypair.fromSecret(secretKey);
}

// Get account balance from Stellar network
export async function getAccountBalance(publicKey: string) {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    
    if (!account.balances || account.balances.length === 0) {
      return [];
    }
    
    const balances = account.balances.map(balance => {
      if (balance.asset_type === 'native') {
        return {
          asset: 'XLM',
          balance: balance.balance,
          asset_type: balance.asset_type
        };
      } else if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
        return {
          asset: `${balance.asset_code}:${balance.asset_issuer}`,
          balance: balance.balance,
          asset_type: balance.asset_type
        };
      } else {
        // For liquidity pools or other asset types
        return {
          asset: 'Unknown Asset',
          balance: balance.balance,
          asset_type: balance.asset_type
        };
      }
    });
    
    return balances;
  } catch (error: any) {
    // If account doesn't exist, return empty array
    if (error?.response?.status === 404 || 
        error?.name === 'NotFoundError' || 
        error?.message?.includes('not found') ||
        error?.message?.includes('Account not found')) {
      return [];
    }
    
    // For network errors, also return empty array
    if (error?.message?.includes('Network Error') || 
        error?.message?.includes('CORS') ||
        error?.name === 'NetworkError') {
      return [];
    }
    
    return [];
  }
}

// Fund testnet account using Stellar Friendbot
export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    // Encode public key for URL
    const encodedPublicKey = encodeURIComponent(publicKey);
    const friendbotUrl = `https://friendbot.stellar.org?addr=${encodedPublicKey}`;
    
    const response = await fetch(friendbotUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrustBridge-Demo/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const responseData = await response.json();
      return true;
    } else if (response.status === 400) {
      const errorText = await response.text();
      
      // If account already exists or is already funded, consider it success
      if (errorText.includes('op_already_exists') || 
          errorText.includes('already exists') || 
          errorText.includes('already funded') ||
          errorText.includes('account already funded to starting balance')) {
        return true;
      }
      
      return false;
    } else {
      const errorText = await response.text();
      return false;
    }
  } catch (error: any) {
    // If timeout or network error, try alternative method
    if (error.name === 'AbortError' || error.message?.includes('fetch')) {
      return await fundAccountAlternative(publicKey);
    }
    
    return false;
  }
}

// Alternative method to fund account
async function fundAccountAlternative(publicKey: string): Promise<boolean> {
  try {
    // First check if account already exists
    const server = new Server(STELLAR_CONFIG.horizonUrl);
    
    try {
      const account = await server.loadAccount(publicKey);
      return true;
    } catch (accountError: any) {
      if (accountError.response?.status === 404) {
        // Try alternative Friendbot endpoint
        const alternativeUrl = `https://horizon-testnet.stellar.org/friendbot?addr=${encodeURIComponent(publicKey)}`;
        
        const response = await fetch(alternativeUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}
