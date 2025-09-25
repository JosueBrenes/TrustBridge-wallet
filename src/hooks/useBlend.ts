import { useState, useEffect } from 'react';
import { 
  getPoolInfo, 
  getPoolEstimates, 
  supplyToPool, 
  getUserPositions, 
  calculateRealTimeEarnings,
  BLEND_CONFIG 
} from '@/lib/blend';
import { Keypair } from '@stellar/stellar-sdk';

interface BlendState {
  poolInfo: any;
  poolEstimates: any;
  userPositions: any;
  earnings: any;
  isLoading: boolean;
  error: string | null;
}

interface SupplyParams {
  keypair: Keypair;
  assetAddress: string;
  amount: string;
}

export function useBlend(poolId: string = BLEND_CONFIG.poolId, userAddress?: string) {
  const [state, setState] = useState<BlendState>({
    poolInfo: null,
    poolEstimates: null,
    userPositions: null,
    earnings: null,
    isLoading: false,
    error: null
  });

  // Cargar información del pool
  const loadPoolInfo = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const info = await getPoolInfo(poolId);
      setState(prev => ({
        ...prev,
        poolInfo: info,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error cargando información del pool: ' + (error as Error).message
      }));
    }
  };

  // Cargar estimaciones del pool (APY, etc.)
  const loadPoolEstimates = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const estimates = await getPoolEstimates(poolId, userAddress);
      setState(prev => ({
        ...prev,
        poolEstimates: estimates,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error cargando estimaciones: ' + (error as Error).message
      }));
    }
  };

  // Cargar posiciones del usuario
  const loadUserPositions = async () => {
    if (!userAddress) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const positions = await getUserPositions(poolId, userAddress);
      setState(prev => ({
        ...prev,
        userPositions: positions,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error cargando posiciones: ' + (error as Error).message
      }));
    }
  };

  // Calcular ganancias en tiempo real
  const loadEarnings = async () => {
    if (!userAddress) return;
    
    try {
      const earnings = await calculateRealTimeEarnings(poolId, userAddress);
      setState(prev => ({
        ...prev,
        earnings: earnings,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error calculando ganancias: ' + (error as Error).message
      }));
    }
  };

  // Depositar en el pool
  const supply = async ({ keypair, assetAddress, amount }: SupplyParams) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await supplyToPool(poolId, keypair, assetAddress, amount);
      
      // Actualizar datos después del supply
      setTimeout(() => {
        loadUserPositions();
        loadEarnings();
      }, 3000);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error en supply: ' + (error as Error).message
      }));
      throw error;
    }
  };

  // Actualizar todos los datos
  const refreshAll = async () => {
    await Promise.all([
      loadPoolInfo(),
      loadPoolEstimates(),
      userAddress ? loadUserPositions() : Promise.resolve(),
      userAddress ? loadEarnings() : Promise.resolve()
    ]);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadPoolInfo();
    loadPoolEstimates();
  }, [poolId]);

  // Cargar datos del usuario cuando cambia la dirección
  useEffect(() => {
    if (userAddress) {
      loadUserPositions();
      loadEarnings();
    }
  }, [userAddress]);

  // Actualizar ganancias cada 30 segundos
  useEffect(() => {
    if (!userAddress) return;
    
    const interval = setInterval(() => {
      loadEarnings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userAddress]);

  return {
    ...state,
    supply,
    refreshAll,
    loadPoolInfo,
    loadPoolEstimates,
    loadUserPositions,
    loadEarnings,
    // Datos útiles para la UI
    hasPositions: !!state.userPositions && Object.keys(state.userPositions).length > 0,
    currentAPY: state.poolEstimates?.apy || '0',
    totalSupplied: state.earnings?.totalSupplied || '0',
    totalEarnings: state.earnings?.totalEarnings || '0'
  };
}