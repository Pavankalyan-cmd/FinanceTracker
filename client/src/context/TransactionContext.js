import { createContext, useState } from "react";

export const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const notifyTransactionChange = () => {
    setLastUpdated(Date.now());
  };

  return (
    <TransactionContext.Provider
      value={{ lastUpdated, notifyTransactionChange }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
