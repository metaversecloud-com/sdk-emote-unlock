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
      <>
        {visitor?.isAdmin && (
          <div className="mb-6 flex flex-col items-center w-full">
            <div className="flex items-center gap-2">
              <AdminIconButton
                setShowSettings={() => setShowSettings(!showSettings)}
                showSettings={showSettings}
              />
              <span className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                {visitor?.isAdmin ? "this might be admin..." : "this might not be admin..."}
              </span>
            </div>
          </div>
        )}
        
        {showSettings && visitor?.isAdmin ? (
          <AdminView />
        ) : (
          <EmoteUnlockView />
        )}
      </>
    </PageContainer>
  );
};

export default Home;
