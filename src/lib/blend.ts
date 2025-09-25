import { 
  Pool, 
  PoolContract, 
  PoolContractV2,
  PoolEstimate, 
  PoolOracle,
  PoolMetadata,
  PoolV1,
  PoolV2,
  RequestType,
  Network,
  PositionsEstimate,
  Version,
  ErrorTypes,
  getOracleDecimals
} from '@blend-capital/blend-sdk';
import { Keypair, Networks, TransactionBuilder, BASE_FEE, xdr, rpc } from '@stellar/stellar-sdk';

// Configuración de Blend Protocol v2 en Testnet (siguiendo blend-ui)
export const BLEND_CONFIG = {
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  // Pool ID oficial de Blend Testnet V2
  poolId: 'CDDG7DLOWSHRYQ2HWGZEZ4UTR7LPTKFFHN3QUCSZEXOWOPARMONX6T65',
  // Pool Factory V2
  poolFactoryId: 'CDSMKKCWEAYQW4DAUSH3XGRMIVIJB44TZ3UA5YCRHT6MP4LWEWR4GYV6',
  // Backstop V2
  backstopId: 'CBHWKF4RHIKOKSURAKXSJRIIA7RJAMJH4VHRVPYGUF4AJ5L544LYZ35X',
  // Emitter
  emitterId: 'CCS5ACKIDOIVW2QMWBF7H3ZM4ZIH2Q2NP7I3P3GH7YXXGN7I3WND3D6G',
  // Oracle Mock
  oracleId: 'CBKKSSMTHJJTQWSIOBJQAIGR42NSY43ZBKKXWF445PE4OLOTOGPOWWF4',
  // Configuración de assets oficiales de Blend Testnet v2
  assets: {
    USDC: {
      contract: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
      code: 'USDC',
      decimals: 7
    },
    XLM: {
      contract: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      code: 'XLM',
      native: true,
      decimals: 7
    },
    BLND: {
      contract: 'CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF',
      code: 'BLND',
      decimals: 7
    },
    wETH: {
      contract: 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
      code: 'wETH',
      decimals: 7
    },
    wBTC: {
      contract: 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
      code: 'wBTC',
      decimals: 7
    }
  }
};

// Configuración de red Stellar (siguiendo blend-ui)
const network: Network = {
  rpc: BLEND_CONFIG.sorobanRpcUrl,
  passphrase: BLEND_CONFIG.networkPassphrase,
  opts: { allowHttp: false }
};

// Servidor RPC de Soroban para transacciones
const stellarRpc = new rpc.Server(BLEND_CONFIG.sorobanRpcUrl);

// Constantes para validación de pools (siguiendo el patrón de blend-ui)
const BACKSTOP_ID_V2 = BLEND_CONFIG.backstopId;
const NOT_BLEND_POOL_ERROR_MESSAGE = 'NOT_BLEND_POOL';

// Oracle price fetcher (opcional - para mejorar la carga de precios)
const ORACLE_PRICE_FETCHER = process.env.NEXT_PUBLIC_ORACLE_PRICE_FETCHER;

// Interfaz para metadatos del pool (siguiendo el patrón de blend-ui)
export interface PoolMeta extends PoolMetadata {
  id: string;
  version: Version;
}

// Función para cargar pool (siguiendo el patrón de blend-ui)
// Función para cargar oracle del pool (siguiendo el patrón de blend-ui)
export async function loadPoolOracle(pool: Pool): Promise<PoolOracle> {
  if (ORACLE_PRICE_FETCHER !== undefined) {
    try {
      const { decimals, latestLedger } = await getOracleDecimals(
        network,
        pool.metadata.oracle
      );
      
      // Para testnet, crear precios mock para cada asset en reserveList
      const mockPrices = new Map<string, number>();
      
      // Iterar sobre reserveList para generar precios mock
      for (const assetAddress of pool.metadata.reserveList) {
        // Buscar el asset en BLEND_CONFIG.assets
        const assetEntry = Object.values(BLEND_CONFIG.assets).find(
          asset => asset.contract === assetAddress
        );
        
        if (assetEntry) {
          // Usar precios mock basados en el tipo de asset
          switch (assetEntry.code) {
            case 'USDC':
              mockPrices.set(assetAddress, 1.0);
              break;
            case 'XLM':
              mockPrices.set(assetAddress, 0.12);
              break;
            case 'BLND':
              mockPrices.set(assetAddress, 0.05);
              break;
            case 'wETH':
              mockPrices.set(assetAddress, 2500.0);
              break;
            case 'wBTC':
              mockPrices.set(assetAddress, 45000.0);
              break;
            default:
              mockPrices.set(assetAddress, 1.0);
          }
        } else {
          // Si no se encuentra el asset, usar precio por defecto
          mockPrices.set(assetAddress, 1.0);
        }
      }
      
      // Validar que tenemos precios para todos los assets
      if (mockPrices.size < pool.metadata.reserveList.length) {
        throw new Error('Invalid number of prices returned from oracle');
      }
      
      return new PoolOracle(pool.metadata.oracle, mockPrices, decimals, latestLedger);
    } catch (e: any) {
      console.error('Price fetcher call failed: ', e);
      // Si el oracle fetcher falla, usar el método por defecto
      return await pool.loadOracle();
    }
  } else {
    return await pool.loadOracle();
  }
}

// Función para cargar pool (siguiendo el patrón de blend-ui)
export async function loadPool(poolMeta: PoolMeta): Promise<Pool> {
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

// Función para cargar metadatos del pool (siguiendo el patrón de blend-ui)
export async function loadPoolMeta(poolId: string): Promise<PoolMeta> {
  try {
    // Usar directamente PoolMetadata.load siguiendo el patrón de blend-ui
    const metadata = await PoolMetadata.load(network, poolId);
    
    // Validar que es un pool v2 válido
    let poolMeta: PoolMeta;
    if (
      metadata.wasmHash === 'a41fc53d6753b6c04eb15b021c55052366a4c8e0e21bc72700f461264ec1350e' ||
      // testnet v2 pool hash
      (network.passphrase === Networks.TESTNET &&
        metadata.wasmHash === '6a7c67449f6bad0d5f641cfbdf03f430ec718faa85107ecb0b97df93410d1c43')
    ) {
      // v2 pool - validar backstop es correcto
      if (metadata.backstop === BACKSTOP_ID_V2) {
        poolMeta = { id: poolId, version: Version.V2, ...metadata } as PoolMeta;
      } else {
        throw new Error(NOT_BLEND_POOL_ERROR_MESSAGE);
      }
    } else {
      throw new Error(NOT_BLEND_POOL_ERROR_MESSAGE);
    }
    
    return poolMeta;
  } catch (error: any) {
    console.error('Error loading pool metadata:', error);
    throw error;
  }
}

export async function getPoolInfo(poolId: string) {
  try {
    // Cargar metadatos del pool primero (siguiendo el patrón de blend-ui)
    const poolMeta = await loadPoolMeta(poolId);
    
    // Cargar el pool usando los metadatos
    const pool = await loadPool(poolMeta);
    
    // Cargar el oracle del pool usando la nueva función con manejo de errores
    const poolOracle = await loadPoolOracle(pool);

    // Crear estimaciones del pool
    const poolEstimate = PoolEstimate.build(pool.reserves, poolOracle);

    return {
      pool,
      poolOracle,
      poolEstimate,
      reserves: pool.reserves
    };
  } catch (error: any) {
    console.error('Error getting pool info:', error);
    throw error;
  }
}

export async function getPoolEstimates(poolId: string, userAddress?: string) {
  try {
    // Cargar metadatos del pool primero
    const poolMeta = await loadPoolMeta(poolId);
    
    // Cargar el pool usando los metadatos
    const pool = await loadPool(poolMeta);
    
    // Cargar el oracle usando la nueva función con manejo de errores
    const poolOracle = await loadPoolOracle(pool);
    
    // Crear estimaciones del pool
    const poolEstimate = PoolEstimate.build(pool.reserves, poolOracle);
    
    let userEstimate = null;
    if (userAddress) {
      // Cargar posiciones del usuario
      const poolUser = await pool.loadUser(userAddress);
      
      // Crear estimaciones de posiciones del usuario
      userEstimate = PositionsEstimate.build(pool, poolOracle, poolUser.positions);
    }
    
    return {
      poolEstimate,
      userEstimate,
      reserves: pool.reserves
    };
  } catch (error) {
    console.error('Error loading pool estimates:', error);
    throw error;
  }
}

// Función para depositar en el pool (siguiendo el patrón de blend-ui)
export async function supplyToPool(
  poolId: string,
  userKeypair: Keypair,
  assetAddress: string,
  amount: string
) {
  try {
    // Cargar metadatos del pool
    const poolMeta = await loadPoolMeta(poolId);
    
    // Obtener información del asset para escalado correcto
    const assetInfo = Object.values(BLEND_CONFIG.assets).find(
      asset => asset.contract === assetAddress
    );
    
    if (!assetInfo) {
      throw new Error(`Asset no soportado: ${assetAddress}`);
    }
    
    // Escalar la cantidad según los decimales del asset (siguiendo blend-ui)
    const scaledAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, assetInfo.decimals)));
    
    // Validar que la cantidad es positiva
    if (scaledAmount <= 0n) {
      throw new Error('La cantidad debe ser mayor que 0');
    }
    
    // Crear el contrato del pool usando PoolContractV2 (siguiendo blend-ui)
    const poolContract = new PoolContractV2(poolMeta.id);
    
    // Crear argumentos de submit siguiendo exactamente el patrón de blend-ui
    const submitArgs = {
      from: userKeypair.publicKey(),
      spender: userKeypair.publicKey(),
      to: userKeypair.publicKey(),
      requests: [
        {
          amount: scaledAmount,
          request_type: RequestType.SupplyCollateral,
          address: assetAddress,
        },
      ],
    };

    // Crear la operación usando el método submit del contrato
    const operation = xdr.Operation.fromXDR(poolContract.submit(submitArgs), 'base64');
    
    // Obtener la cuenta del usuario
    const account = await stellarRpc.getAccount(userKeypair.publicKey());
    
    // Construir la transacción con timebounds más amplios
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: BLEND_CONFIG.networkPassphrase,
      timebounds: { 
        minTime: 0, 
        maxTime: Math.floor(Date.now() / 1000) + 5 * 60 // 5 minutos
      },
    })
      .addOperation(operation)
      .build();

    // Simular la transacción primero para validar
    console.log('Simulando transacción de supply...');
    const simResponse = await stellarRpc.simulateTransaction(transaction);
    
    if (rpc.Api.isSimulationError(simResponse)) {
      console.error('Error en simulación:', simResponse.error);
      throw new Error(`Simulation failed: ${simResponse.error}`);
    }
    
    console.log('Simulación exitosa, ensamblando transacción...');
    
    // Ensamblar la transacción con los resultados de la simulación
    const assembledTx = rpc.assembleTransaction(transaction, simResponse).build();
    
    // Firmar la transacción
    assembledTx.sign(userKeypair);

    // Enviar la transacción
    const result = await stellarRpc.sendTransaction(assembledTx);
    console.log('Supply exitoso:', result);
    return result;
  } catch (error) {
    console.error('Error en supply:', error);
    throw error;
  }
}

// Función para obtener posiciones del usuario
export async function getUserPositions(poolId: string, userAddress: string) {
  try {
    // Cargar metadatos del pool primero
    const poolMeta = await loadPoolMeta(poolId);
    
    // Cargar el pool usando los metadatos
    const pool = await loadPool(poolMeta);
    
    // Cargar datos del usuario
    const poolUser = await pool.loadUser(userAddress);
    
    return poolUser;
  } catch (error) {
    console.error('Error loading user positions:', error);
    throw error;
  }
}

// Función para calcular ganancias en tiempo real
export async function calculateRealTimeEarnings(poolId: string, userAddress: string) {
  try {
    // Cargar metadatos del pool primero
    const poolMeta = await loadPoolMeta(poolId);
    
    // Cargar el pool usando los metadatos
    const pool = await loadPool(poolMeta);
    
    // Cargar el oracle usando la nueva función con manejo de errores
    const poolOracle = await loadPoolOracle(pool);
    
    // Cargar datos del usuario
    const poolUser = await pool.loadUser(userAddress);
    
    // Verificar que poolUser.positions existe antes de usarlo
    if (!poolUser || !poolUser.positions) {
      console.warn(`No positions found for user ${userAddress} in pool ${poolId}`);
      return {
        totalSupplied: 0,
        totalBorrowed: 0,
        netWorth: 0,
        borrowLimit: 0,
        borrowCapacity: 0,
        positions: new Map()
      };
    }

    // Verificar que poolUser.positions tiene las propiedades necesarias
    if (!poolUser.positions.liabilities || !poolUser.positions.collateral || !poolUser.positions.supply) {
      console.warn(`Invalid positions structure for user ${userAddress} in pool ${poolId}`);
      return {
        totalSupplied: 0,
        totalBorrowed: 0,
        netWorth: 0,
        borrowLimit: 0,
        borrowCapacity: 0,
        positions: new Map()
      };
    }
    
    // Crear estimaciones de posiciones del usuario
    const positionsEstimate = PositionsEstimate.build(pool.reserves, poolOracle, poolUser.positions);
    
    return {
      totalSupplied: positionsEstimate.totalSupplied,
      totalBorrowed: positionsEstimate.totalBorrowed,
      netWorth: positionsEstimate.totalSupplied - positionsEstimate.totalBorrowed,
      borrowLimit: positionsEstimate.borrowLimit,
      borrowCapacity: positionsEstimate.borrowCap,
      positions: poolUser.positions
    };
  } catch (error) {
    console.error('Error calculating real-time earnings:', error);
    // Retornar valores por defecto en caso de error
    return {
      totalSupplied: 0,
      totalBorrowed: 0,
      netWorth: 0,
      borrowLimit: 0,
      borrowCapacity: 0,
      positions: new Map()
    };
  }
}