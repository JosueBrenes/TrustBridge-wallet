'use client';

import { useState } from 'react';
import { useBlend } from '@/hooks/useBlend';
import { useWallet } from '@/hooks/useWallet';
import { BLEND_CONFIG } from '@/lib/blend';

export default function BlendSection() {
  const { publicKey, keypair, isConnected } = useWallet();
  const {
    poolInfo,
    poolEstimates,
    userPositions,
    earnings,
    isLoading,
    error,
    supply,
    refreshAll,
    hasPositions,
    currentAPY,
    totalSupplied,
    totalEarnings
  } = useBlend(BLEND_CONFIG.poolId, publicKey || undefined);

  const [supplyAmount, setSupplyAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDC');

  const handleSupply = async () => {
    if (!keypair || !supplyAmount || parseFloat(supplyAmount) <= 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    try {
      const assetAddress = BLEND_CONFIG.assets[selectedAsset as keyof typeof BLEND_CONFIG.assets].contract;
      await supply({
        keypair,
        assetAddress,
        amount: supplyAmount
      });
      
      alert('Supply exitoso! Los datos se actualizarán en unos segundos.');
      setSupplyAmount('');
    } catch (error) {
      console.error('Error en supply:', error);
      alert('Error en supply: ' + (error as Error).message);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
        <h2 className="text-3xl font-bold mb-6 text-slate-800">Blend Protocol</h2>
        <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 px-6 py-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-semibold">Conecta tu wallet para usar Blend Protocol</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Blend Protocol</h2>
        <button
          onClick={refreshAll}
          disabled={isLoading}
          className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm"
        >
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-6 py-4 rounded-r-lg mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información del Pool */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">APY Actual</h3>
          <p className="text-3xl font-bold text-blue-700">
            {currentAPY ? `${(parseFloat(currentAPY) * 100).toFixed(2)}%` : 'Cargando...'}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <h3 className="font-bold text-green-900 mb-3 text-lg">Estado del Pool</h3>
          <p className="text-xl font-semibold text-green-700">
            {poolInfo ? 'Activo' : 'Cargando...'}
          </p>
        </div>
      </div>

      {/* Posiciones del Usuario */}
      {hasPositions && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-800">Tus Posiciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">Total Depositado</p>
              <p className="text-2xl font-bold text-slate-800">{totalSupplied} USDC</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">Ganancias Totales</p>
              <p className="text-2xl font-bold text-green-600">+{totalEarnings} USDC</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">APY Ganado</p>
              <p className="text-2xl font-bold text-blue-600">
                {currentAPY ? `${(parseFloat(currentAPY) * 100).toFixed(2)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ganancias en Tiempo Real */}
      {earnings && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded mb-6">
          <h3 className="text-lg font-semibold mb-3">Ganancias en Tiempo Real</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Valor Actual</p>
              <p className="text-xl font-bold">{earnings.currentValue || '0'} USDC</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ganancias Diarias Estimadas</p>
              <p className="text-xl font-bold text-green-600">+{earnings.dailyEarnings || '0'} USDC</p>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Supply */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Depositar en Pool</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USDC">USDC</option>
              <option value="XLM">XLM</option>
              <option value="BLND">BLND</option>
              <option value="wETH">wETH</option>
              <option value="wBTC">wBTC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={supplyAmount}
              onChange={(e) => setSupplyAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSupply}
            disabled={isLoading || !supplyAmount || parseFloat(supplyAmount) <= 0}
            className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded"
          >
            {isLoading ? 'Procesando...' : `Depositar ${supplyAmount || '0'} ${selectedAsset}`}
          </button>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Información del Pool</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Pool ID:</strong> {BLEND_CONFIG.poolId}</p>
          <p><strong>Red:</strong> Stellar Testnet</p>
          <p><strong>Protocolo:</strong> Blend Capital</p>
        </div>
      </div>
    </div>
  );
}