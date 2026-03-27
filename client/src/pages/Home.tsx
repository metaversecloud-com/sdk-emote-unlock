import { useContext, useEffect, useState } from "react";

// components
import { PageContainer, UnlockView } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { SET_VISITOR } from "@/context/types";

const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasInteractiveParams, hasSetupBackend } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasInteractiveParams) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          setGameState(dispatch, response.data.unlockData);

          dispatch!({
            type: SET_VISITOR,
            payload: { visitor: { isAdmin: response.data.isAdmin } },
          });
        })
        .catch((error) => setErrorMessage(dispatch, error))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasInteractiveParams, dispatch]);

  if (!hasSetupBackend) return <div />;

  return (
    <PageContainer isLoading={isLoading}>
      <UnlockView />
    </PageContainer>
  );
};

export default Home;
