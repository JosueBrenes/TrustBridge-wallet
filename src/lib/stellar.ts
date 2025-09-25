import { Keypair, Networks, rpc, TransactionBuilder, Operation, Asset, Horizon } from '@stellar/stellar-sdk';

// Configuración de red Stellar Testnet
export const STELLAR_CONFIG = {
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
};

// Inicializar servidor RPC de Soroban
export const server = new rpc.Server(STELLAR_CONFIG.sorobanRpcUrl);

// Inicializar servidor Horizon para operaciones básicas
export const horizonServer = new Horizon.Server(STELLAR_CONFIG.horizonUrl);

// Función para generar un nuevo keypair (wallet)
export function generateWallet() {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
    keypair: keypair
  };
}

// Función para crear cuenta desde secret key
export function getKeypairFromSecret(secretKey: string) {
  return Keypair.fromSecret(secretKey);
}

// Función para obtener balance de cuenta
export async function getAccountBalance(publicKey: string) {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    
    // Verificar que account y balances existan
    if (!account || !account.balances) {
      console.warn('Account or balances not found for:', publicKey);
      return [];
    }
    
    const balances = account.balances.map(balance => ({
      asset: balance.asset_type === 'native' ? 'XLM' : `${balance.asset_code}:${balance.asset_issuer}`,
      balance: balance.balance,
      asset_type: balance.asset_type
    }));
    return balances;
  } catch (error: any) {
    console.error('Error obteniendo balance:', error);
    
    // Si la cuenta no existe, retornar array vacío en lugar de error
    if (error.name === 'NotFoundError' || (error.message && error.message.includes('not found'))) {
      console.warn('Account not found, returning empty balances');
      return [];
    }
    
    return [];
  }
}

// Función para financiar cuenta en testnet (usando Friendbot)
// Función para financiar cuenta en testnet usando Friendbot
export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  try {
    console.log(`🚀 Financiando cuenta: ${publicKey}`);
    
    // Usar Friendbot de Stellar para financiar la cuenta
    const friendbotUrl = `https://friendbot.stellar.org?addr=${publicKey}`;
    console.log(`📡 Llamando a Friendbot: ${friendbotUrl}`);
    
    const response = await fetch(friendbotUrl);
    console.log(`📊 Respuesta de Friendbot - Status: ${response.status}, OK: ${response.ok}`);

    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ Cuenta financiada exitosamente:', responseText);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Friendbot funding failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      // Si la cuenta ya existe, considerarlo como éxito
      if (response.status === 400 && errorText.includes('op_already_exists')) {
        console.log('ℹ️ La cuenta ya existe, considerando como éxito');
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error en Friendbot:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      error: error
    });
    return false;
  }
}