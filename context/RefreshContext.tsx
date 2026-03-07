import React, { createContext, useContext, useState } from 'react';

interface RefreshContextType {
  refreshSignal: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshSignal: 0,
  triggerRefresh: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshSignal, setRefreshSignal] = useState(0);

  const triggerRefresh = () => {
    setRefreshSignal((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshSignal, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
