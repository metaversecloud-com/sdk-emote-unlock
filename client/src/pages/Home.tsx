import { useContext, useEffect, useState } from "react";

// components
import { PageContainer } from "@/components";
import AdminIconButton from "@/components/AdminIconButton";
import EmoteUnlockView from "@/components/EmoteUnlockView";
import AdminView from "@/components/AdminView";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { gameState, hasInteractiveParams, hasSetupBackend, visitor } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (hasInteractiveParams) {
      setIsLoading(true);
      backendAPI
        .get("/emote-unlock")
        .then((response) => {
          setGameState(dispatch, response.data);
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
      <div className="relative w-full">
        {visitor?.isAdmin && (
          <div className="absolute top-0 right-0 z-10">
            <AdminIconButton
              setShowSettings={() => setShowSettings(!showSettings)}
              showSettings={showSettings}
            />
          </div>
        )}
        
        {showSettings && visitor?.isAdmin ? (
          <AdminView />
        ) : (
          <EmoteUnlockView />
        )}
      </div>
    </PageContainer>
  );
};

export default Home;
