import React, { createContext, useContext, useState } from 'react';

interface RefreshContextType {
  refreshSignal: number;
  triggerRefresh: () => void;
  searchSignal: number;
  triggerSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isListView: boolean;
  toggleListView: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshSignal: 0,
  triggerRefresh: () => { },
  searchSignal: 0,
  triggerSearch: () => { },
  searchQuery: "",
  setSearchQuery: () => { },
  isListView: false,
  toggleListView: () => { },
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [searchSignal, setSearchSignal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListView, setIsListView] = useState(false);

  const triggerRefresh = () => {
    setRefreshSignal((prev) => prev + 1);
  };

  const triggerSearch = () => {
    setSearchSignal((prev) => prev + 1);
  };

  const toggleListView = () => {
    setIsListView((prev) => !prev);
  };

  return (
    <RefreshContext.Provider value={{
      refreshSignal,
      triggerRefresh,
      searchSignal,
      triggerSearch,
      searchQuery,
      setSearchQuery,
      isListView,
      toggleListView
    }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
