import { useState, useContext, useEffect } from "react";

//context
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";

//utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { Loading } from "./Loading";

interface Emote {
  id: string;
  name: string;
  previewUrl: string;
}

export const AdminView = () => {
  const { gameState } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);

  const [showEngagement, setShowEngagement] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  //form fields
  const [selectedEmote, setSelectedEmote] = useState(gameState?.emoteId || "");
  const [emoteDescription, setEmoteDescription] = useState(gameState?.emoteDescription || "");
  const [password, setPassword] = useState(gameState?.password || "");
  const [availableEmotes, setAvailableEmotes] = useState<Emote[]>([]);

  //load current settings and available emotes
  useEffect(() => {
    const fetchEmotes = async () => {
      await backendAPI
        .get("/available-emotes")
        .then((response) => {
          if (!response.data.success) {
            return setErrorMessage(dispatch, "Failed to fetch available emotes");
          }

          setAvailableEmotes(response.data.emotes || []);

          setErrorMessage(dispatch, undefined);
        })
        .catch((error) => {
          setErrorMessage(dispatch, error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchEmotes();
  }, [gameState, dispatch]);

  const handleSave = async () => {
    if (!selectedEmote || !password.trim()) {
      return setErrorMessage(dispatch, "Please select an emote and set a password");
    }

    const selectedEmoteObject = availableEmotes.find((e) => e.id === selectedEmote);
    if (!selectedEmoteObject) {
      return setErrorMessage(dispatch, "Selected emote not found");
    }

    setAreButtonsDisabled(true);

    await backendAPI
      .post("/emote-unlock/config", {
        selectedEmote: {
          id: selectedEmoteObject.id,
          name: selectedEmoteObject.name,
          previewUrl: selectedEmoteObject.previewUrl,
        },
        emoteDescription: emoteDescription.trim(),
        unlockCondition: {
          type: "password",
          value: password.trim().toLowerCase(),
        },
      })
      .then((response) => {
        setGameState(dispatch, response.data.unlockData);

        //reset engagement data visibility after save
        setShowEngagement(false);

        setErrorMessage(dispatch, undefined);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="grid gap-6">
      {/* configuration section */}
      <h2>Configuration</h2>
      <p>Allow users to unlock an emote when they successfully answer a question or enter the correct password.</p>

      {/* emote selection */}
      <div className="grid gap-2">
        <h4>Emote Selection</h4>
        <p>Choose an emote to unlock for your visitors</p>

        <select
          value={selectedEmote}
          onChange={(e) => setSelectedEmote(e.target.value)}
          className="input"
          disabled={areButtonsDisabled || availableEmotes.length === 0}
        >
          <option value="">Select an emote</option>
          {availableEmotes.map((emote) => (
            <option key={emote.id} value={emote.id}>
              {emote.name}
            </option>
          ))}
        </select>
      </div>

      {/* preview if emote selected */}
      {selectedEmote && availableEmotes.length > 0 && (
        <div className="grid gap-2 text-center">
          <img
            src={availableEmotes.find((e) => e.id === selectedEmote)?.previewUrl || ""}
            alt="Emote preview"
            className="mx-auto"
          />
          <h4>{availableEmotes.find((e) => e.id === selectedEmote)?.name || "Selected Emote"}</h4>
          <p className="p2">Emote ID: {selectedEmote}</p>
        </div>
      )}

      {/* description */}
      <div className="grid gap-2">
        <h4>Question/Description</h4>
        <p>Enter a description or question to prompt users to the correct answer</p>
        <textarea
          value={emoteDescription}
          onChange={(e) => setEmoteDescription(e.target.value)}
          className="input"
          placeholder="Example: What bird's heart beats 1000 times a minute?"
          disabled={areButtonsDisabled}
        ></textarea>
      </div>

      {/* password */}
      <div className="grid gap-2">
        <h4>Password/Answer</h4>
        <p>Choose a password or answer. We recommend 1-2 words. Answers are not case sensitive.</p>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="Example: hummingbird"
          disabled={areButtonsDisabled}
        />
      </div>

      {/* save button */}
      <div className="mt-6">
        <button onClick={handleSave} disabled={areButtonsDisabled} className="btn">
          {areButtonsDisabled ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {/* engagement section */}
      <div className="mt-8">
        <button
          className="flex items-center justify-between w-full p-5 bg-white rounded-lg shadow-sm"
          onClick={() => {
            console.log("Toggling engagement view. Current game state:", gameState);
            setShowEngagement(!showEngagement);
          }}
        >
          <h3>Engagement</h3>
          <span>{showEngagement ? "▲" : "▼"}</span>
        </button>

        {showEngagement && (
          <>
            {gameState ? (
              <>
                {/*current configuration summary*/}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="pb-4">Current Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">Emote</div>
                      <div className="font-medium">{gameState.emoteName || "Not set"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">Password</div>
                      <div className="font-medium font-mono">{gameState.password || "Not set"}</div>
                    </div>
                    <div className="col-span-2 bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">Description</div>
                      <div className="text-gray-700">{gameState.emoteDescription || "No description"}</div>
                    </div>
                  </div>
                </div>

                {gameState.stats && (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold mb-1">{gameState.stats.attempts || 0}</div>
                      <p className="p2">Users who attempted</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold mb-1">
                        {(gameState.stats.successfulUnlocks && Object.keys(gameState.stats.successfulUnlocks).length) ||
                          0}
                      </div>
                      <p className="p2">Users who successfully unlocked</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>No configuration data available. Please save a configuration first.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminView;
