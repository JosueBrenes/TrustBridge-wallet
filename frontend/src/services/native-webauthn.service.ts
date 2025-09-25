// Utility functions for base64url encoding/decoding
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Add padding if needed
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// WebAuthn interfaces
interface WebAuthnCredential {
  id: string | ArrayBuffer;
  type: 'public-key';
  transports?: AuthenticatorTransport[];
}

interface WebAuthnRegistrationOptions {
  challenge: string | ArrayBuffer;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: WebAuthnCredential[];
}

interface WebAuthnAuthenticationOptions {
  challenge: string | ArrayBuffer;
  allowCredentials?: WebAuthnCredential[];
  userVerification?: UserVerificationRequirement;
  timeout?: number;
  rpId?: string;
  publicKey?: WebAuthnAuthenticationOptions;
}

export interface WebAuthnCreatePasskeyInput {
  optionsJSON: WebAuthnRegistrationOptions;
}

export interface WebAuthnCreatePasskeyResult {
  rawResponse: PublicKeyCredential;
  credentialId: string;
}

export interface WebAuthnAuthenticateWithPasskeyInput {
  optionsJSON: WebAuthnAuthenticationOptions;
}

export interface WebAuthnAuthenticateWithPasskeyResult {
  rawResponse: PublicKeyCredential;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
}

// Process registration options
function processRegistrationOptions(
  options: WebAuthnRegistrationOptions
): CredentialCreationOptions {
  return {
    publicKey: {
      challenge:
        typeof options.challenge === "string"
          ? base64UrlToArrayBuffer(options.challenge)
          : options.challenge,
      rp: options.rp,
      user: {
        id:
          typeof options.user.id === "string"
            ? base64UrlToArrayBuffer(options.user.id)
            : options.user.id,
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      attestation: options.attestation,
      authenticatorSelection: options.authenticatorSelection,
      excludeCredentials:
        options.excludeCredentials?.map((cred: WebAuthnCredential) => ({
          id:
            typeof cred.id === "string"
              ? base64UrlToArrayBuffer(cred.id)
              : cred.id,
          type: cred.type as "public-key",
          transports: cred.transports,
        })) || [],
    },
  };
}

// Process authentication options
function processAuthenticationOptions(
  options: WebAuthnAuthenticationOptions
): CredentialRequestOptions {
  // Check if options has publicKey property (new format) or is the direct options object (old format)
  const opts = options.publicKey || options;

  return {
    publicKey: {
      challenge:
        typeof opts.challenge === "string"
          ? base64UrlToArrayBuffer(opts.challenge)
          : opts.challenge,
      allowCredentials:
        opts.allowCredentials?.map((cred: WebAuthnCredential) => ({
          id:
            typeof cred.id === "string"
              ? base64UrlToArrayBuffer(cred.id)
              : cred.id,
          type: cred.type as "public-key",
          transports: cred.transports,
        })) || [],
      userVerification: opts.userVerification as UserVerificationRequirement,
      timeout: opts.timeout,
      rpId: opts.rpId,
    },
  };
}

export class NativeWebAuthnService {
  async createPasskey(
    input: WebAuthnCreatePasskeyInput
  ): Promise<WebAuthnCreatePasskeyResult> {
    try {
      // Verify WebAuthn support
      if (!navigator.credentials || !navigator.credentials.create) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Process options
      const credentialCreationOptions = processRegistrationOptions(
        input.optionsJSON
      );

      // Create credential
      const credential = (await navigator.credentials.create(
        credentialCreationOptions
      )) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Prepare response in expected format
      const rawResponse = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(response.attestationObject),
          transports:
            (
              response as AuthenticatorAttestationResponse & {
                getTransports?: () => AuthenticatorTransport[];
              }
            ).getTransports?.() || [],
        },
        type: credential.type,
      };

      return {
        rawResponse: rawResponse as unknown as PublicKeyCredential,
        credentialId: credential.id,
      };
    } catch (error) {
      console.error("Error creating passkey:", error);
      throw error;
    }
  }

  async authenticateWithPasskey(
    input: WebAuthnAuthenticateWithPasskeyInput
  ): Promise<WebAuthnAuthenticateWithPasskeyResult> {
    try {
      // Verify WebAuthn support
      if (!navigator.credentials || !navigator.credentials.get) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Process options
      const credentialRequestOptions = processAuthenticationOptions(
        input.optionsJSON
      );

      // Get credential
      const credential = (await navigator.credentials.get(
        credentialRequestOptions
      )) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to authenticate with passkey");
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // Prepare response
      const rawResponse = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
          authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
          signature: arrayBufferToBase64Url(response.signature),
          userHandle: response.userHandle
            ? arrayBufferToBase64Url(response.userHandle)
            : null,
        },
        type: credential.type,
      };

      return {
        rawResponse: rawResponse as unknown as PublicKeyCredential,
        clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
        authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
        signature: arrayBufferToBase64Url(response.signature),
      };
    } catch (error) {
      console.error("Error authenticating with passkey:", error);
      throw error;
    }
  }
}

export const nativeWebauthnService = new NativeWebAuthnService();