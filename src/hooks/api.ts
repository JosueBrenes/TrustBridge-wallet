import {
  Backstop,
  BackstopPool,
  BackstopPoolUser,
  BackstopPoolV1,
  BackstopPoolV2,
  ErrorTypes,
  getOracleDecimals,
  Network,
  Pool,
  PoolMetadata,
  PoolOracle,
  PoolUser,
  PoolV1,
  PoolV2,
  Positions,
  UserBalance,
  Version,
} from '@blend-capital/blend-sdk';
import {
  Account,
  Address,
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  rpc,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import {
  keepPreviousData,
  useQueries,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

const DEFAULT_STALE_TIME = 30 * 1000;
const USER_STALE_TIME = 60 * 1000;
const BACKSTOP_ID = process.env.NEXT_PUBLIC_BACKSTOP || '';
const BACKSTOP_ID_V2 = process.env.NEXT_PUBLIC_BACKSTOP_V2 || 'CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X';
const ORACLE_PRICE_FETCHER = process.env.NEXT_PUBLIC_ORACLE_PRICE_FETCHER;

const NOT_BLEND_POOL_ERROR_MESSAGE = 'NOT_BLEND_POOL';

// Network configuration
const network: Network = {
  rpc: 'https://soroban-testnet.stellar.org',
  passphrase: Networks.TESTNET,
  opts: { allowHttp: false }
};

export interface PoolMeta extends PoolMetadata {
  id: string;
  version: Version;
}

//********** Pool Data **********//

export function usePoolMeta(
  poolId: string,
  enabled: boolean = true
): UseQueryResult<PoolMeta, Error> {
  return useQuery({
    staleTime: Infinity,
    queryKey: ['poolMetadata', poolId],
    enabled: enabled && poolId !== '',
    queryFn: async () => {
      try {
        let metadata = await PoolMetadata.load(network, poolId);
        if (
          metadata.wasmHash === 'baf978f10efdbcd85747868bef8832845ea6809f7643b67a4ac0cd669327fc2c'
        ) {
          // v1 pool - validate backstop is correct
          if (metadata.backstop === BACKSTOP_ID) {
            return { id: poolId, version: Version.V1, ...metadata } as PoolMeta;
          }
        } else if (
          metadata.wasmHash ===
            'a41fc53d6753b6c04eb15b021c55052366a4c8e0e21bc72700f461264ec1350e' ||
          // testnet v2 pool hash
          (network.passphrase === Networks.TESTNET &&
            metadata.wasmHash ===
              '6a7c67449f6bad0d5f641cfbdf03f430ec718faa85107ecb0b97df93410d1c43')
        ) {
          // v2 pool - validate backstop is correct
          if (metadata.backstop === BACKSTOP_ID_V2) {
            return { id: poolId, version: Version.V2, ...metadata } as PoolMeta;
          }
        }
        throw new Error(NOT_BLEND_POOL_ERROR_MESSAGE);
      } catch (e: any) {
        if (e?.message?.includes(ErrorTypes.LedgerEntryParseError)) {
          throw new Error(NOT_BLEND_POOL_ERROR_MESSAGE);
        } else {
          console.error('Error fetching pool metadata', e);
        }
        throw e;
      }
    },
    retry: (failureCount, error) => {
      if (error?.message === NOT_BLEND_POOL_ERROR_MESSAGE) {
        // Do not retry if this is not a blend pool
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Fetches pool data for the given pool ID.
 * @param poolMeta - The pool metadata
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the pool data.
 */
export function usePool(
  poolMeta: PoolMeta | undefined,
  enabled: boolean = true
): UseQueryResult<Pool, Error> {
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['pool', poolMeta?.id],
    enabled: enabled && poolMeta !== undefined,
    queryFn: async () => {
      if (poolMeta !== undefined) {
        try {
          if (poolMeta.version === Version.V2) {
            return await PoolV2.loadWithMetadata(network, poolMeta.id, poolMeta);
          } else {
            return await PoolV1.loadWithMetadata(network, poolMeta.id, poolMeta);
          }
        } catch (e: any) {
          console.error('Error fetching pool data', e);
          throw e;
        }
      }
    },
  });
}

/**
 * Fetch the oracle data for the given pool.
 * @param pool - The pool
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the oracle data.
 */
export function usePoolOracle(
  pool: Pool | undefined,
  enabled: boolean = true
): UseQueryResult<PoolOracle, Error> {
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['poolOracle', pool?.id],
    enabled: pool !== undefined && enabled,
    queryFn: async () => {
      if (pool !== undefined) {
        if (ORACLE_PRICE_FETCHER !== undefined) {
          try {
            const { decimals, latestLedger } = await getOracleDecimals(
              network,
              pool.metadata.oracle
            );
            // Mock prices for testnet - following blend-ui pattern
            const mockPrices = new Map();
            const assets = {
              'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU': { price: BigInt(1000000), timestamp: BigInt(Date.now()) }, // USDC
              'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC': { price: BigInt(100000), timestamp: BigInt(Date.now()) }, // XLM
              'CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF': { price: BigInt(50000), timestamp: BigInt(Date.now()) }, // BLND
              'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE': { price: BigInt(2500000000), timestamp: BigInt(Date.now()) }, // wETH
              'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI': { price: BigInt(50000000000), timestamp: BigInt(Date.now()) } // wBTC
            };
            
            for (const [assetId, priceData] of Object.entries(assets)) {
              mockPrices.set(assetId, priceData);
            }
            
            return new PoolOracle(pool.metadata.oracle, mockPrices, decimals, latestLedger);
          } catch (e: any) {
            console.error('Price fetcher call failed: ', e);
            // if the oracle fetcher fails, fallback to default loading method
            return await pool.loadOracle();
          }
        } else {
          return await pool.loadOracle();
        }
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Fetch the user for the given pool and connected wallet.
 * @param pool - The pool
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the user positions.
 */
export function usePoolUser(
  pool: Pool | undefined,
  enabled: boolean = true
): UseQueryResult<PoolUser, Error> {
  const { walletAddress, connected } = useWallet();
  return useQuery({
    staleTime: USER_STALE_TIME,
    queryKey: ['poolPositions', pool?.id, walletAddress],
    enabled: enabled && pool !== undefined && connected,
    placeholderData: new PoolUser(
      walletAddress,
      new Positions(new Map(), new Map(), new Map()),
      new Map()
    ),
    queryFn: async () => {
      if (pool !== undefined && walletAddress !== '') {
        return await pool.loadUser(walletAddress);
      }
    },
  });
}

/**
 * Fetch the backstop pool data for the given pool ID.
 * @param poolMeta - The pool metadata
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the backstop pool data.
 */
export function useBackstopPool(
  poolMeta: PoolMeta | undefined,
  enabled: boolean = true
): UseQueryResult<BackstopPool, Error> {
  return useQuery({
    staleTime: DEFAULT_STALE_TIME,
    queryKey: ['backstopPool', poolMeta?.id],
    enabled: enabled && poolMeta !== undefined,
    queryFn: async () => {
      if (poolMeta !== undefined) {
        return poolMeta.version === Version.V2
          ? await BackstopPoolV2.load(network, BACKSTOP_ID_V2, poolMeta.id)
          : await BackstopPoolV1.load(network, BACKSTOP_ID, poolMeta.id);
      }
    },
  });
}

/**
 * Fetch the backstop pool user data for the given pool and connected wallet.
 * @param poolMeta - The pool metadata
 * @param walletAddress - The wallet address
 * @param enabled - Whether the query is enabled (optional - defaults to true)
 * @returns Query result with the backstop pool user data.
 */
export function useBackstopPoolUser(
  poolMeta: PoolMeta | undefined,
  walletAddress: string = '',
  enabled: boolean = true
): UseQueryResult<BackstopPoolUser, Error> {
  return useQuery({
    staleTime: USER_STALE_TIME,
    queryKey: ['backstopPoolUser', poolMeta?.id, walletAddress],
    enabled: enabled && poolMeta !== undefined && walletAddress !== '',
    placeholderData: new BackstopPoolUser(
      walletAddress,
      poolMeta?.id ?? '',
      new UserBalance(BigInt(0), [], BigInt(0), BigInt(0)),
      undefined
    ),
    queryFn: async () => {
      if (walletAddress !== '' && poolMeta !== undefined) {
        return await BackstopPoolUser.load(
          network,
          poolMeta.version === Version.V2 ? BACKSTOP_ID_V2 : BACKSTOP_ID,
          poolMeta.id,
          walletAddress
        );
      }
    },
  });
}