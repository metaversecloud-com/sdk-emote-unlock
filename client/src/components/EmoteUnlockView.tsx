import { useState, useContext, KeyboardEvent } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

const EmoteUnlockView = () => {
  const { gameState } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadyUnlocked, setIsAlreadyUnlocked] = useState(false);

  const handleUnlockAttempt = async () => {
    if (!password.trim()) {
      setErrorMessage(dispatch, "Please enter a password");
      return;
    }

    setIsSubmitting(true);

    await backendAPI
      .post("/emote-unlock/attempt", {
        password: password.trim().toLowerCase(),
      })
      .then((response) => {
        setGameState(dispatch, response.data.unlockData);
        setIsAlreadyUnlocked(true);
        setPassword("");
        setErrorMessage(dispatch, undefined);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUnlockAttempt();
    }
  };

  const renderUnlockSuccess = () => {
    return (
      <div className="text-center py-8 px-6 bg-green-50 rounded-lg border border-green-100">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="pb-4">Emote Already Unlocked!</h3>
        <p>You've already unlocked this emote. Click on your avatar to use it!</p>
      </div>
    );
  };

  const renderPasswordInput = () => {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-5">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter answer..."
            className="input"
            disabled={isSubmitting}
          />

          <button className="btn" onClick={handleUnlockAttempt} disabled={isSubmitting}>
            {isSubmitting ? "Checking..." : "Unlock Emote"}
          </button>
        </div>
      </div>
    );
  };

  const renderUnlockUI = () => {
    if (isAlreadyUnlocked) return renderUnlockSuccess();

    return renderPasswordInput();
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h3>Emote Unlock Challenge</h3>

        <div className="my-4">
          <img
            src={gameState?.emotePreviewUrl ? gameState.emotePreviewUrl : "/default-emote-icon.svg"}
            alt="Emote preview"
            className="w-48 h-48 object-contain mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold">{gameState?.emoteName || "Mystery Emote"}</h2>
        </div>

        <p>
          {/* directly check for description in multiple places and log everything */}
          {(() => {
            // try to get description from various places
            const description =
              gameState?.emoteDescription || gameState?.emoteDescription || localStorage.getItem("emoteDescription");
            return description || "Question/Description: Enter the correct answer to unlock this emote!";
          })()}
        </p>
      </div>

      {renderUnlockUI()}

      {gameState?.stats && (
        <div className="mt-10 text-sm text-center text-gray-500">
          <p>{gameState.stats.successfulUnlocks || 0} users have unlocked this emote</p>
        </div>
      )}
    </>
  );
};

export default EmoteUnlockView;
