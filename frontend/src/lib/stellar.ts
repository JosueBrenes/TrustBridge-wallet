import {
  Keypair,
  Networks,
  rpc,
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Memo,
} from "@stellar/stellar-sdk";

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

// USDC Asset on Stellar Testnet (Circle's USDC)
export const USDC_ASSET = new Asset(
  "USDC",
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" // Circle's USDC issuer on testnet
);

// Get orderbook for XLM/USDC pair
export async function getOrderbook(selling: Asset, buying: Asset) {
  try {
    const orderbook = await horizonServer.orderbook(selling, buying).call();
    return orderbook;
  } catch (error) {
    console.error("Error fetching orderbook:", error);
    throw error;
  }
}

// Get current market price for XLM/USDC
export async function getMarketPrice(): Promise<{
  price: string;
  spread: string;
}> {
  try {
    const orderbook = await getOrderbook(Asset.native(), USDC_ASSET);

    if (orderbook.bids.length === 0 || orderbook.asks.length === 0) {
      throw new Error("No market data available");
    }

    const bestBid = parseFloat(orderbook.bids[0].price);
    const bestAsk = parseFloat(orderbook.asks[0].price);
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = (((bestAsk - bestBid) / midPrice) * 100).toFixed(2);

    return {
      price: midPrice.toFixed(6),
      spread: spread,
    };
  } catch (error) {
    console.error("Error getting market price:", error);
    // Fallback price if market data is unavailable
    return {
      price: "0.120000", // Approximate XLM/USDC price
      spread: "0.50",
    };
  }
}

// Swap XLM to USDC using path payment
export async function swapXLMToUSDC(
  senderSecretKey: string,
  xlmAmount: string,
  minUSDCAmount: string
): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
  receivedAmount?: string;
}> {
  try {
    const senderKeypair = Keypair.fromSecret(senderSecretKey);
    const senderPublicKey = senderKeypair.publicKey();

    // Load sender account
    const senderAccount = await horizonServer.loadAccount(senderPublicKey);

    // Check if account has USDC trustline
    const hasUSDCTrustline = senderAccount.balances.some(
      (balance: Horizon.HorizonApi.BalanceLine) =>
        balance.asset_type !== "native" &&
        "asset_code" in balance &&
        balance.asset_code === "USDC" &&
        "asset_issuer" in balance &&
        balance.asset_issuer === USDC_ASSET.getIssuer()
    );

    // Create transaction builder
    const transactionBuilder = new TransactionBuilder(senderAccount, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    });

    // Add trustline for USDC if it doesn't exist
    if (!hasUSDCTrustline) {
      transactionBuilder.addOperation(
        Operation.changeTrust({
          asset: USDC_ASSET,
          limit: "1000000", // 1M USDC limit
        })
      );
    }

    // Add path payment operation
    transactionBuilder.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: Asset.native(),
        sendAmount: xlmAmount,
        destination: senderPublicKey, // Send to self
        destAsset: USDC_ASSET,
        destMin: minUSDCAmount,
        path: [], // Direct conversion, no intermediate assets
      })
    );

    // Set timeout and build transaction
    const transaction = transactionBuilder.setTimeout(30).build();
    transaction.sign(senderKeypair);

    // Submit transaction
    const result = await horizonServer.submitTransaction(transaction);

    // Parse the result to get received amount
    let receivedAmount = "0";
    if (result.successful) {
      // Try to extract the received amount from transaction result
      try {
        // Get the transaction details to extract the received amount
        const transactionRecord = await horizonServer
          .transactions()
          .transaction(result.hash)
          .call();
        const operations = await transactionRecord.operations();
        const pathPaymentOp = operations.records.find(
          (op: Horizon.HorizonApi.BaseOperationResponse) =>
            op.type === "path_payment_strict_send"
        ) as Horizon.HorizonApi.PathPaymentStrictSendOperationResponse;
        if (pathPaymentOp) {
          receivedAmount = pathPaymentOp.amount;
        }
      } catch (e) {
        console.warn("Could not extract received amount:", e);
      }
    }

    return {
      success: true,
      transactionHash: result.hash,
      receivedAmount,
    };
  } catch (error: unknown) {
    console.error("Error swapping XLM to USDC:", error);

    let errorMessage = "Failed to swap XLM to USDC";

    if (error && typeof error === "object") {
      if ("response" in error) {
        const response = (
          error as {
            response?: {
              data?: {
                extras?: {
                  result_codes?: {
                    transaction?: string;
                    operations?: string[];
                  };
                };
              };
            };
          }
        ).response;
        if (response?.data?.extras?.result_codes) {
          const resultCodes = response.data.extras.result_codes;
          if (resultCodes.transaction === "tx_insufficient_balance") {
            errorMessage = "Insufficient XLM balance for swap";
          } else if (resultCodes.operations?.includes("op_over_source_max")) {
            errorMessage = "Swap amount exceeds maximum allowed";
          } else if (resultCodes.operations?.includes("op_under_dest_min")) {
            errorMessage =
              "Swap would result in less USDC than minimum specified";
          } else if (resultCodes.operations?.includes("op_too_few_offers")) {
            errorMessage = "Not enough liquidity available for this swap";
          } else if (resultCodes.operations?.includes("op_line_full")) {
            errorMessage = "USDC trustline limit would be exceeded";
          }
        }
      } else if ("message" in error) {
        errorMessage = (error as Error).message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
export async function sendPayment(
  senderSecretKey: string,
  destinationPublicKey: string,
  amount: string,
  memo?: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    // Get sender keypair
    const senderKeypair = Keypair.fromSecret(senderSecretKey);
    const senderPublicKey = senderKeypair.publicKey();

    // Load sender account
    const senderAccount = await horizonServer.loadAccount(senderPublicKey);

    // Create transaction
    const transaction = new TransactionBuilder(senderAccount, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: Asset.native(), // XLM
          amount: amount,
        })
      )
      .setTimeout(30); // 30 seconds timeout

    // Add memo if provided
    if (memo && memo.trim()) {
      transaction.addMemo(Memo.text(memo.trim()));
    }

    // Build and sign transaction
    const builtTransaction = transaction.build();
    builtTransaction.sign(senderKeypair);

    // Submit transaction
    const result = await horizonServer.submitTransaction(builtTransaction);

    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error: unknown) {
    console.error("Error sending payment:", error);

    let errorMessage = "Failed to send payment";

    if (error && typeof error === "object") {
      if ("response" in error) {
        const response = (
          error as {
            response?: {
              data?: {
                extras?: {
                  result_codes?: {
                    transaction?: string;
                    operations?: string[];
                  };
                };
              };
            };
          }
        ).response;
        if (response?.data?.extras?.result_codes) {
          const resultCodes = response.data.extras.result_codes;
          if (resultCodes.transaction === "tx_insufficient_balance") {
            errorMessage = "Insufficient balance to complete the transaction";
          } else if (resultCodes.transaction === "tx_bad_seq") {
            errorMessage = "Transaction sequence error. Please try again";
          } else if (resultCodes.operations?.includes("op_no_destination")) {
            errorMessage = "Destination account does not exist";
          } else if (resultCodes.operations?.includes("op_underfunded")) {
            errorMessage = "Insufficient funds for this transaction";
          }
        }
      } else if ("message" in error) {
        errorMessage = (error as Error).message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
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

// Transaction types for better type safety
export interface StellarTransaction {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  fee_charged: string | number;
  operation_count: number;
  envelope_xdr: string;
  result_xdr: string;
  result_meta_xdr: string;
  memo?: string;
  memo_type?: string;
  successful: boolean;
  paging_token: string;
}

export interface TransactionOperation {
  id: string;
  type: string;
  type_i: number;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  starting_balance?: string;
  funder?: string;
  account?: string;
  into?: string;
  authorize?: boolean;
  trustor?: string;
  trustee?: string;
  limit?: string;
  selling_asset_type?: string;
  selling_asset_code?: string;
  selling_asset_issuer?: string;
  buying_asset_type?: string;
  buying_asset_code?: string;
  buying_asset_issuer?: string;
  offer_id?: string;
  price?: string;
  price_r?: {
    n: number;
    d: number;
  };
}

export interface ProcessedTransaction {
  id: string;
  hash: string;
  date: string;
  type: string;
  amount: string;
  asset: string;
  from?: string;
  to?: string;
  memo?: string;
  successful: boolean;
  fee: string;
  operationCount: number;
  operations: TransactionOperation[];
}

// Get transaction history for an account
export async function getTransactionHistory(
  publicKey: string,
  limit: number = 50,
  cursor?: string
): Promise<{
  transactions: ProcessedTransaction[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  try {
    let transactionsCall = horizonServer
      .transactions()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .includeFailed(true);

    if (cursor) {
      transactionsCall = transactionsCall.cursor(cursor);
    }

    const transactionsResponse = await transactionsCall.call();

    const processedTransactions: ProcessedTransaction[] = [];

    for (const tx of transactionsResponse.records) {
      // Get operations for this transaction
      const operationsResponse = await horizonServer
        .operations()
        .forTransaction(tx.hash)
        .call();

      const operations = operationsResponse.records as TransactionOperation[];

      // Process the transaction
      const processedTx = await processTransaction(tx, operations, publicKey);
      processedTransactions.push(processedTx);
    }

    return {
      transactions: processedTransactions,
      hasMore: transactionsResponse.records.length === limit,
      nextCursor:
        transactionsResponse.records.length > 0
          ? transactionsResponse.records[
              transactionsResponse.records.length - 1
            ].paging_token
          : undefined,
    };
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
}

// Process a single transaction to extract meaningful information
async function processTransaction(
  tx: StellarTransaction,
  operations: TransactionOperation[],
  userPublicKey: string
): Promise<ProcessedTransaction> {
  let transactionType = "Unknown";
  let amount = "0";
  let asset = "XLM";
  let from: string | undefined;
  let to: string | undefined;

  // Analyze operations to determine transaction type and details
  if (operations.length > 0) {
    const mainOperation = operations[0];

    switch (mainOperation.type) {
      case "payment":
        transactionType =
          mainOperation.from === userPublicKey ? "Send" : "Receive";
        amount = mainOperation.amount || "0";
        from = mainOperation.from;
        to = mainOperation.to;

        if (mainOperation.asset_type === "native") {
          asset = "XLM";
        } else {
          asset = mainOperation.asset_code || "Unknown";
        }
        break;

      case "create_account":
        transactionType =
          mainOperation.funder === userPublicKey
            ? "Account Created (Sent)"
            : "Account Created (Received)";
        amount = mainOperation.starting_balance || "0";
        from = mainOperation.funder;
        to = mainOperation.account;
        asset = "XLM";
        break;

      case "path_payment_strict_receive":
      case "path_payment_strict_send":
        transactionType =
          mainOperation.from === userPublicKey
            ? "Path Payment (Send)"
            : "Path Payment (Receive)";
        amount = mainOperation.amount || "0";
        from = mainOperation.from;
        to = mainOperation.to;

        if (mainOperation.asset_type === "native") {
          asset = "XLM";
        } else {
          asset = mainOperation.asset_code || "Unknown";
        }
        break;

      case "manage_sell_offer":
      case "manage_buy_offer":
        transactionType = "Trade Offer";
        amount = mainOperation.amount || "0";

        if (mainOperation.selling_asset_type === "native") {
          asset = "XLM";
        } else {
          asset = mainOperation.selling_asset_code || "Unknown";
        }
        break;

      case "change_trust":
        transactionType = "Trust Line";
        amount = mainOperation.limit || "0";
        asset = mainOperation.asset_code || "Unknown";
        break;

      case "account_merge":
        transactionType = "Account Merge";
        from = mainOperation.account;
        to = mainOperation.into;
        asset = "XLM";
        break;

      case "inflation":
        transactionType = "Inflation";
        asset = "XLM";
        break;

      case "manage_data":
        transactionType = "Manage Data";
        break;

      case "bump_sequence":
        transactionType = "Bump Sequence";
        break;

      case "create_claimable_balance":
        transactionType = "Create Claimable Balance";
        amount = mainOperation.amount || "0";
        if (mainOperation.asset_type === "native") {
          asset = "XLM";
        } else {
          asset = mainOperation.asset_code || "Unknown";
        }
        break;

      case "claim_claimable_balance":
        transactionType = "Claim Balance";
        break;

      case "begin_sponsoring_future_reserves":
        transactionType = "Begin Sponsoring";
        break;

      case "end_sponsoring_future_reserves":
        transactionType = "End Sponsoring";
        break;

      case "revoke_sponsorship":
        transactionType = "Revoke Sponsorship";
        break;

      case "clawback":
        transactionType = "Clawback";
        amount = mainOperation.amount || "0";
        from = mainOperation.from;
        asset = mainOperation.asset_code || "Unknown";
        break;

      case "clawback_claimable_balance":
        transactionType = "Clawback Claimable Balance";
        break;

      case "set_trust_line_flags":
        transactionType = "Set Trust Line Flags";
        asset = mainOperation.asset_code || "Unknown";
        break;

      case "liquidity_pool_deposit":
        transactionType = "LP Deposit";
        break;

      case "liquidity_pool_withdraw":
        transactionType = "LP Withdraw";
        break;

      default:
        transactionType = mainOperation.type
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        break;
    }
  }

  // Handle multiple operations
  if (operations.length > 1) {
    transactionType += ` (+${operations.length - 1} ops)`;
  }

  return {
    id: tx.id,
    hash: tx.hash,
    date: tx.created_at,
    type: transactionType,
    amount,
    asset,
    from,
    to,
    memo: tx.memo,
    successful: tx.successful,
    fee: typeof tx.fee_charged === 'string' ? tx.fee_charged : tx.fee_charged.toString(),
    operationCount: tx.operation_count,
    operations,
  };
}

// Get account effects (more detailed transaction information)
export async function getAccountEffects(
  publicKey: string,
  limit: number = 50,
  cursor?: string
): Promise<any> {
  try {
    let effectsCall = horizonServer
      .effects()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit);

    if (cursor) {
      effectsCall = effectsCall.cursor(cursor);
    }

    const effectsResponse = await effectsCall.call();
    return effectsResponse;
  } catch (error) {
    console.error("Error fetching account effects:", error);
    throw error;
  }
}

// Get payments for an account (simplified transaction view)
export async function getAccountPayments(
  publicKey: string,
  limit: number = 50,
  cursor?: string
): Promise<any> {
  try {
    let paymentsCall = horizonServer
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .includeFailed(true);

    if (cursor) {
      paymentsCall = paymentsCall.cursor(cursor);
    }

    const paymentsResponse = await paymentsCall.call();
    return paymentsResponse;
  } catch (error) {
    console.error("Error fetching account payments:", error);
    throw error;
  }
}
