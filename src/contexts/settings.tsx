import React, { useContext } from 'react';
import { Network } from '@blend-capital/blend-sdk';
import { BLEND_CONFIG } from '../lib/blend';

export interface ISettingsContext {
  network: Network;
}

const SettingsContext = React.createContext<ISettingsContext | undefined>(undefined);

export const SettingsProvider = ({ children = null as any }) => {
  const network: Network = {
    rpc: BLEND_CONFIG.sorobanRpcUrl,
    passphrase: BLEND_CONFIG.networkPassphrase,
    opts: { allowHttp: false }
  };

  return (
    <SettingsContext.Provider
      value={{
        network,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('Component rendered outside the provider tree');
  }

  return context;
};