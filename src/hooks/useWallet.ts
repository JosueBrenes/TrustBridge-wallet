import { useState, useEffect } from 'react';
import { generateWallet, getKeypairFromSecret, getAccountBalance, fundTestnetAccount } from '@/lib/stellar';
import { Keypair } from '@stellar/stellar-sdk';

interface WalletState {
  publicKey: string | null;
  secretKey: string | null;
  keypair: Keypair | null;
  balances: Array<{
    asset: string;
    balance: string;
    asset_type: string;
  }>;
  isLoading: boolean;
  error: string | null;
  isPasswordProtected: boolean;
  hasRecoveryPhrase: boolean;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    secretKey: null,
    keypair: null,
    balances: [],
    isLoading: false,
    error: null,
    isPasswordProtected: false,
    hasRecoveryPhrase: false
  });

  // Generar nueva wallet con contraseña y recovery phrase
  const createWalletWithPassword = (publicKey: string, secretKey: string, password: string) => {
    try {
      const keypair = getKeypairFromSecret(secretKey);
      
      // Encriptar y guardar datos de la wallet
      const walletData = {
        publicKey,
        secretKey,
        password: btoa(password), // Codificación básica (en producción usar encriptación real)
        timestamp: Date.now()
      };
      
      setWallet(prev => ({
        ...prev,
        publicKey,
        secretKey,
        keypair,
        error: null,
        isPasswordProtected: true,
        hasRecoveryPhrase: true
      }));
      
      // Guardar en localStorage
      localStorage.setItem('demo_wallet_data', JSON.stringify(walletData));
      
      return { publicKey, secretKey, keypair };
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        error: 'Error creando wallet: ' + (error as Error).message
      }));
      return null;
    }
  };

  // Generar nueva wallet (método original para compatibilidad)
  const createWallet = () => {
    try {
      const newWallet = generateWallet();
      setWallet(prev => ({
        ...prev,
        publicKey: newWallet.publicKey,
        secretKey: newWallet.secretKey,
        keypair: newWallet.keypair,
        error: null,
        isPasswordProtected: false,
        hasRecoveryPhrase: false
      }));
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('demo_wallet_secret', newWallet.secretKey);
      
      return newWallet;
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        error: 'Error generando wallet: ' + (error as Error).message
      }));
      return null;
    }
  };

  // Importar wallet desde secret key
  const importWallet = (secretKey: string) => {
    try {
      const keypair = getKeypairFromSecret(secretKey);
      setWallet(prev => ({
        ...prev,
        publicKey: keypair.publicKey(),
        secretKey: secretKey,
        keypair: keypair,
        error: null
      }));
      
      // Guardar en localStorage
      localStorage.setItem('demo_wallet_secret', secretKey);
      
      return true;
    } catch (error) {
      setWallet(prev => ({
        ...prev,
        error: 'Secret key inválido: ' + (error as Error).message
      }));
      return false;
    }
  };

  // Actualizar balances
  const refreshBalances = async () => {
    if (!wallet.publicKey) return;
    
    setWallet(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🔄 Obteniendo balances para:', wallet.publicKey);
      const balances = await getAccountBalance(wallet.publicKey);
      
      if (balances.length === 0) {
        console.log('ℹ️ No se encontraron balances - la cuenta puede no estar financiada aún');
      } else {
        console.log('✅ Balances obtenidos:', balances);
      }
      
      setWallet(prev => ({
        ...prev,
        balances,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('❌ Error obteniendo balances:', error);
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error obteniendo balances: ' + (error as Error).message
      }));
    }
  };

  // Financiar cuenta en testnet
  const fundAccount = async () => {
    if (!wallet.publicKey) return false;
    
    setWallet(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Intentando financiar cuenta:', wallet.publicKey);
      const success = await fundTestnetAccount(wallet.publicKey);
      
      if (success) {
        console.log('Cuenta financiada exitosamente');
        // Esperar un poco más para que la transacción se propague
        setTimeout(() => {
          console.log('Actualizando balances después del fondeo...');
          refreshBalances();
        }, 3000);
      } else {
        console.error('Error al financiar la cuenta');
      }
      
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: success ? null : 'Error financiando cuenta'
      }));
      
      return success;
    } catch (error) {
      console.error('Error en fundAccount:', error);
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error financiando cuenta: ' + (error as Error).message
      }));
      return false;
    }
  };

  // Desconectar wallet
  const disconnectWallet = () => {
    setWallet({
      publicKey: null,
      secretKey: null,
      keypair: null,
      balances: [],
      isLoading: false,
      error: null,
      isPasswordProtected: false,
      hasRecoveryPhrase: false
    });
    localStorage.removeItem('demo_wallet_secret');
    localStorage.removeItem('demo_wallet_data');
  };

  // Cargar wallet desde localStorage al inicializar
  useEffect(() => {
    // Primero intentar cargar wallet con contraseña
    const savedWalletData = localStorage.getItem('demo_wallet_data');
    if (savedWalletData) {
      try {
        const walletData = JSON.parse(savedWalletData);
        const keypair = getKeypairFromSecret(walletData.secretKey);
        setWallet(prev => ({
          ...prev,
          publicKey: walletData.publicKey,
          secretKey: walletData.secretKey,
          keypair,
          isPasswordProtected: true,
          hasRecoveryPhrase: true
        }));
        return;
      } catch (error) {
        console.error('Error cargando wallet con contraseña:', error);
        localStorage.removeItem('demo_wallet_data');
      }
    }

    // Fallback: cargar wallet simple
    const savedSecret = localStorage.getItem('demo_wallet_secret');
    if (savedSecret) {
      importWallet(savedSecret);
    }
  }, []);

  // Actualizar balances cuando se conecta la wallet
  useEffect(() => {
    if (wallet.publicKey) {
      // Solo intentar obtener balances si la wallet está conectada
      // No importa si la cuenta existe o no, getAccountBalance maneja esto
      refreshBalances();
    }
  }, [wallet.publicKey]);

  return {
    ...wallet,
    createWallet,
    createWalletWithPassword,
    importWallet,
    refreshBalances,
    fundAccount,
    disconnectWallet,
    isConnected: !!wallet.publicKey
  };
}