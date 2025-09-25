import React, { useContext } from 'react';
import { Networks } from '@stellar/stellar-sdk';

export interface ISettingsContext {
  network: {
    rpc: string;
    passphrase: string;
    opts: { allowHttp: boolean };
  };
}

const SettingsContext = React.createContext<ISettingsContext | undefined>(undefined);

export const SettingsProvider = ({ children = null as any }) => {
  const network = {
    rpc: 'https://soroban-testnet.stellar.org',
    passphrase: Networks.TESTNET,
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