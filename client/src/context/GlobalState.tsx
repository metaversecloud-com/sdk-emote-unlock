import { useReducer, useEffect } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "./GlobalContext";
import { initialState } from "./constants";
import { globalReducer } from "./reducer";
import { backendAPI } from "@/utils";
import { SET_VISITOR } from "./types";

export const GlobalState = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // Fetch visitor data when the app loads
  useEffect(() => {
    const fetchVisitorData = async () => {
      try {
        console.log("Fetching visitor data...");
        const response = await backendAPI.get("/visitor");
        console.log("Visitor API response:", response.data);
        
        if (response.data && response.data.visitor) {
          // Force admin status for debugging - remove in production
          const visitor = {
            ...response.data.visitor,
            isAdmin: true // Force admin for testing
          };
          
          dispatch({
            type: SET_VISITOR,
            payload: { visitor }
          });
          
          console.log("Admin status set:", visitor.isAdmin);
        }
      } catch (error) {
        console.error("Error fetching visitor data:", error);
      }
    };

    fetchVisitorData();
  }, []);

  return (
    <GlobalStateContext.Provider value={state}>
      <GlobalDispatchContext.Provider value={dispatch}>{children}</GlobalDispatchContext.Provider>
    </GlobalStateContext.Provider>
  );
};