import React, { useReducer } from "react";
import { initialState } from "./constants";
import { GlobalState } from "./GlobalState";

interface GlobalProviderProps {
  children: React.ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  return <GlobalState>{children}</GlobalState>;
};
