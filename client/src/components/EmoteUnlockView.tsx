import { useState, useContext, useEffect, KeyboardEvent } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";
import { backendAPI, setErrorMessage } from "@/utils";

interface GameState {
  unlockData?: {
    emoteId?: string;
    emoteName?: string;
    emotePreviewUrl?: string;
    emoteDescription?: string;
    stats?: {
      successfulUnlocks?: number;
      attempts?: number;
      unlockUsers?: Array<{
        visitorId: string;
        displayName: string;
        unlockedAt: string;
      }>;
    };
  };
  isEmoteUnlocked?: boolean;
}

const EmoteUnlockView = () => {
  const { gameState, visitor } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAlreadyUnlocked, setIsAlreadyUnlocked] = useState(false);
  
  const typedGameState = gameState as GameState;

  // Check if emote is already unlocked on initial load
  useEffect(() => {
    if (typedGameState?.isEmoteUnlocked) {
      setIsAlreadyUnlocked(true);
    }
  }, [typedGameState]);

  const handleUnlockAttempt = async () => {
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await backendAPI.post("/emote-unlock/attempt", {
        password: password.trim().toLowerCase(),
      });

      if (response.data.success) {
        // Trigger particle effect on success
        try {
          await backendAPI.post("/trigger-particle", {
            name: "Sparkle",
            duration: 3
          });
        } catch (err) {
          console.error("Failed to trigger particle effect", err);
        }

        // Check if already unlocked
        if (response.data.alreadyUnlocked) {
          setIsAlreadyUnlocked(true);
          window.parent.postMessage({ 
            type: "showToast", 
            title: "Already Unlocked", 
            description: "You've already unlocked this emote! Click on your avatar to use it."
          }, "*");
        } else {
          setShowSuccess(true);
          window.parent.postMessage({ 
            type: "showToast", 
            title: "Congrats! Emote Unlocked", 
            description: "You just unlocked a new emote! Click on your avatar to test it out."
          }, "*");
          
          // Refresh game state to update UI
          try {
            const refreshResponse = await backendAPI.get("/emote-unlock");
            if (refreshResponse.data.success) {
              // Update game state
            }
          } catch (refreshError) {
            console.error("Failed to refresh state", refreshError);
          }
        }
        
        // Clear password field
        setPassword("");
      } else {
        // Display custom message from server if provided, otherwise show default message
        setError(response.data.message || "Oops! That's not right. Try again!");
      }
    } catch (error: any) {
      setErrorMessage(dispatch, error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUnlockAttempt();
    }
  };
  
  const renderUnlockUI = () => {
    if (isAlreadyUnlocked) {
      return (
        <div className="text-center py-10 px-6 bg-green-50 rounded-lg border border-green-100">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-semibold mb-3">Emote Already Unlocked!</h3>
          <p className="text-gray-600 text-lg">
            You've already unlocked this emote. Click on your avatar to use it!
          </p>
        </div>
      );
    }
    
    if (showSuccess) {
      return (
        <div className="text-center py-10 px-6 bg-green-50 rounded-lg border border-green-100">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-semibold mb-3">Emote Unlocked!</h3>
          <p className="text-gray-600 text-lg">
            Congratulations! You've unlocked a new emote. Click on your avatar to try it out!
          </p>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <div className="flex flex-col gap-5">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter password..."
            className="px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            disabled={isSubmitting}
          />
          
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
            onClick={handleUnlockAttempt}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking..." : "Unlock Emote"}
          </button>
        </div>
        
        {error && (
          <div className="mt-5 text-red-500 text-center text-lg">
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Emote Unlock Challenge</h1>
        
        {typedGameState?.unlockData?.emotePreviewUrl ? (
          <div className="mb-8">
            <img 
              src={typedGameState.unlockData.emotePreviewUrl} 
              alt="Emote preview"
              className="w-48 h-48 object-contain mx-auto mb-4" 
            />
            <h2 className="text-2xl font-semibold">{typedGameState.unlockData.emoteName || "Mystery Emote"}</h2>
          </div>
        ) : (
          <div className="mb-8">
            <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://sdk-style.s3.amazonaws.com/icons/lock.svg" 
                alt="Mystery Emote" 
                className="w-20 h-20" 
              />
            </div>
            <h2 className="text-2xl font-semibold">Mystery Emote</h2>
          </div>
        )}
        
        <p className="text-xl mb-8 px-4">
          {typedGameState?.unlockData?.emoteDescription || "Enter the correct password to unlock a special emote!"}
        </p>
      </div>

      {renderUnlockUI()}

      {typedGameState?.unlockData?.stats && (
        <div className="mt-10 text-sm text-center text-gray-500">
          <p>{typedGameState.unlockData.stats.successfulUnlocks || 0} users have unlocked this emote</p>
        </div>
      )}
    </div>
  );
};

export default EmoteUnlockView; 