// ApiClient class for DeFindex API integration

interface ApiResponse {
  [key: string]: unknown;
}

interface DepositWithdrawParams {
  amounts: number[];
  from: string;
}

interface SendParams {
  xdr: string;
}

class ApiClient {
  private readonly apiUrl = "api.defindex.io";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Helper for POST requests
  async postData(endpoint: string, vaultAddress: string, params: DepositWithdrawParams | SendParams): Promise<ApiResponse> {
    const response = await fetch(`https://${this.apiUrl}/vault/${vaultAddress}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(params)
    });
    return await response.json();
  }

  // Helper for GET requests
  async getData(endpoint: string, vaultAddress: string, params?: Record<string, string>): Promise<ApiResponse> {
    const url = params
      ? `https://${this.apiUrl}/vault/${vaultAddress}/${endpoint}?${new URLSearchParams(params).toString()}`
      : `https://${this.apiUrl}/vault/${vaultAddress}/${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    return await response.json();
  }
}

// Configuration
const API_KEY = process.env.NEXT_PUBLIC_DEFINDEX_API_KEY || 'sk_test_key';
const apiClient = new ApiClient(API_KEY);

// Default vault address from documentation
const DEFAULT_VAULT = 'CAQ6PAG4X6L7LJVGOKSQ6RU2LADWK4EQXRJGMUWL7SECS7LXUEQLM5U7';

// Mock signer function - replace with actual Stellar SDK signing
const signerFunction = (unsignedTx: string): string => {
  // TODO: Implement actual transaction signing with Stellar SDK
  console.log('Signing transaction:', unsignedTx);
  return unsignedTx; // Replace with actual signing logic
};

// Core DeFindex functions
async function deposit(amount: number, user: string, vaultAddress: string = DEFAULT_VAULT): Promise<ApiResponse> {
  // Step 1: Request an unsigned transaction from the API
  const { xdr: unsignedTx } = await apiClient.postData("deposit", vaultAddress, {
    amounts: [amount],
    from: user
  });

  // Step 2: Sign the transaction
  const signedTx = signerFunction(unsignedTx as string);

  // Step 3: Send the signed transaction back to the API
  const response = await apiClient.postData("send", vaultAddress, {
    xdr: signedTx
  });
  return response;
}

async function withdraw(amount: number, user: string, vaultAddress: string = DEFAULT_VAULT): Promise<ApiResponse> {
  const { xdr: unsignedTx } = await apiClient.postData("withdraw", vaultAddress, {
    amounts: [amount],
    from: user
  });

  const signedTx = signerFunction(unsignedTx as string);

  const response = await apiClient.postData("send", vaultAddress, {
    xdr: signedTx
  });

  return response;
}

async function balance(user: string, vaultAddress: string = DEFAULT_VAULT): Promise<bigint> {
  try {
    const response = await apiClient.getData("balance", vaultAddress, {
      from: user
    });
    
    console.log('Balance API response:', response);
    
    // Handle different possible response structures
    if (response.underlyingBalance && Array.isArray(response.underlyingBalance)) {
      return BigInt(response.underlyingBalance[0]);
    } else if (response.balance !== undefined && response.balance !== null) {
      return BigInt(response.balance as string | number);
    } else if (typeof response === 'string' || typeof response === 'number') {
      return BigInt(response);
    } else {
      console.warn('Unexpected balance response structure:', response);
      return BigInt(0);
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return BigInt(0);
  }
}

async function apy(vaultAddress: string = DEFAULT_VAULT): Promise<number> {
  const { apy: apyValue } = await apiClient.getData("apy", vaultAddress);
  return apyValue as number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  vaultAddress: string;
}

export class DefindexService {
  static async getAPY(vaultAddress: string = DEFAULT_VAULT): Promise<number> {
    try {
      return await apy(vaultAddress);
    } catch (error) {
      console.error('Error fetching APY:', error);
      return 0;
    }
  }

  static async getUserBalance(userAddress: string, vaultAddress: string = DEFAULT_VAULT): Promise<string> {
    try {
      const userBalance = await balance(userAddress, vaultAddress);
      return userBalance.toString();
    } catch (error) {
      console.error('Error fetching user balance:', error);
      return '0';
    }
  }

  static async depositFunds(amount: string, userAddress: string, vaultAddress: string = DEFAULT_VAULT): Promise<ApiResponse> {
    try {
      const result = await deposit(Number(amount), userAddress, vaultAddress);
      return result;
    } catch (error) {
      console.error('Error depositing funds:', error);
      throw error;
    }
  }

  static async withdrawFunds(amount: string, userAddress: string, vaultAddress: string = DEFAULT_VAULT): Promise<ApiResponse> {
    try {
      const result = await withdraw(Number(amount), userAddress, vaultAddress);
      return result;
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    }
  }

  static async getStrategies(): Promise<Strategy[]> {
    // Mock strategies with real vault addresses
    const mockStrategies: Strategy[] = [
      {
        id: '1',
        name: 'USDC Yield Strategy',
        description: 'Low-risk USDC lending strategy with stable returns',
        apy: await this.getAPY(DEFAULT_VAULT),
        tvl: '$2.5M',
        risk: 'Low',
        vaultAddress: DEFAULT_VAULT
      },
      {
        id: '2',
        name: 'XLM Growth Strategy',
        description: 'Medium-risk XLM staking and DeFi strategy',
        apy: 12.5,
        tvl: '$1.8M',
        risk: 'Medium',
        vaultAddress: 'CBQHNAXSI55GX2GN6D67GK7BHKF22UCLSJTU2KLZYEQFSQYG7TVHKH3E'
      }
    ];

    return mockStrategies;
  }
}