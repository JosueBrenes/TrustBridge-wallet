import React, { useContext, useState } from 'react';

export interface IWalletContext {
  connected: boolean;
  walletAddress: string;
}

const WalletContext = React.createContext<IWalletContext | undefined>(undefined);

export const WalletProvider = ({ children = null }: { children?: React.ReactNode }) => {
  const [connected] = useState<boolean>(false);
  const [walletAddress] = useState<string>('');

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