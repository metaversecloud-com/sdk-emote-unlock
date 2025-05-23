import { useState, useContext, KeyboardEvent } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

const EmoteUnlockView = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { gameState, profileId } = useContext(GlobalStateContext);
  const { emoteId, emoteDescription, emotePreviewUrl, stats } = gameState || {};

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (emoteId === "") return <h4>This challenge is not available at this time. Please check back later!</h4>;

  return (
    <>
      <h3>Emote Unlock Challenge</h3>

      {!Object.keys(stats?.successfulUnlocks ?? {}).includes(profileId!) ? (
        <div className="flex flex-col gap-5">
          <img
            src={emotePreviewUrl || "/default-emote-icon.svg"}
            alt="Emote preview"
            className="w-48 h-48 object-contain mx-auto mb-4"
          />

          <p>
            {emoteDescription ||
              localStorage.getItem("emoteDescription") ||
              "Question/Description: Enter the correct answer to unlock this emote!"}
          </p>

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
      ) : (
        <div className="text-center mt-6 py-8 px-6 bg-green-50 rounded-lg border border-green-100">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="pb-4">Emote Unlocked!</h3>
          <p>You've unlocked this emote. Click on your avatar to use it!</p>
        </div>
      )}

      {stats && (
        <p className="p2 pt-8 text-center">
          {(stats.successfulUnlocks && Object.keys(stats.successfulUnlocks).length) || 0} users have unlocked this emote
        </p>
      )}
    </>
  );
};

export default EmoteUnlockView;
