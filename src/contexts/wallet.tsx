import React, { useContext, useState } from 'react';

export interface IWalletContext {
  connected: boolean;
  walletAddress: string;
}

const WalletContext = React.createContext<IWalletContext | undefined>(undefined);

export const WalletProvider = ({ children = null as any }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');

  return (
    <WalletContext.Provider
      value={{
        connected,
        walletAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('Component rendered outside the provider tree');
  }

  return context;
};