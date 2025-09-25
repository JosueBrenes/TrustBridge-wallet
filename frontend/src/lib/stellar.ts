import { Keypair, Networks, rpc, Horizon } from "@stellar/stellar-sdk";

const { Server } = Horizon;

export const STELLAR_CONFIG = {
  networkPassphrase: Networks.TESTNET,
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
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
    keypair,
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

    const balances = account.balances.map((balance) => {
      if (balance.asset_type === "native") {
        return {
          asset: "XLM",
          balance: balance.balance,
          asset_type: balance.asset_type,
        };
      } else if (
        balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12"
      ) {
        return {
          asset: `${balance.asset_code}:${balance.asset_issuer}`,
          balance: balance.balance,
          asset_type: balance.asset_type,
        };
      } else {
        // For liquidity pools or other asset types
        return {
          asset: "Unknown Asset",
          balance: balance.balance,
          asset_type: balance.asset_type,
        };
      }
    });

    return balances;
  } catch (error: unknown) {
    console.error("Error getting account balance:", error);

    // Check if it's a 404 error (account not found)
    if (error && typeof error === "object" && "response" in error) {
      const response = (error as { response: { status: number } }).response;
      if (response.status === 404) {
        return [];
      }
    }

    throw error;
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
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "TrustBridge-Demo/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return true;
    } else if (response.status === 400) {
      const _errorText = await response.text();

      // If account already exists or is already funded, consider it success
      if (
        _errorText.includes("op_already_exists") ||
        _errorText.includes("already exists") ||
        _errorText.includes("already funded") ||
        _errorText.includes("account already funded to starting balance")
      ) {
        return true;
      }

      return false;
    } else {
      await response.text();
      return false;
    }
  } catch (error: unknown) {
    // If timeout or network error, try alternative method
    if (
      error &&
      typeof error === "object" &&
      ("name" in error || "message" in error)
    ) {
      const errorObj = error as { name?: string; message?: string };
      if (
        errorObj.name === "AbortError" ||
        errorObj.message?.includes("fetch")
      ) {
        return await fundAccountAlternative(publicKey);
      }
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
      await server.loadAccount(publicKey);
      return true;
    } catch (accountError: unknown) {
      if (
        accountError &&
        typeof accountError === "object" &&
        "response" in accountError
      ) {
        const errorObj = accountError as { response: { status: number } };
        if (errorObj.response?.status === 404) {
          // Try alternative Friendbot endpoint
          const alternativeUrl = `https://horizon-testnet.stellar.org/friendbot?addr=${encodeURIComponent(
            publicKey
          )}`;

          try {
            const response = await fetch(alternativeUrl, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            });

            if (response.ok) {
              return true;
            } else {
              return false;
            }
          } catch (error: unknown) {
            console.error("Error funding account:", error);

            // Check if it's a 400 error (account already exists)
            if (error && typeof error === "object" && "response" in error) {
              const response = (
                error as {
                  response: { status: number; data?: { detail?: string } };
                }
              ).response;
              if (
                response.status === 400 &&
                response.data?.detail?.includes("createAccountAlreadyExist")
              ) {
                return true; // Account already funded
              }
            }

            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  } catch {
    console.error("Error in alternative funding method");
    return false;
  }
}
