import { useState, useContext, useEffect } from "react";

// components
import { PageFooter } from "@/components";

// context
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

interface GameState {
  unlockData?: {
    emoteId?: string;
    emoteName?: string;
    emotePreviewUrl?: string;
    emoteDescription?: string;
    password?: string;
    stats?: {
      attempts?: number;
      successfulUnlocks?: number;
      unlockUsers?: Array<{
        visitorId: string;
        displayName: string;
        unlockedAt: string;
      }>;
    };
  };
}

interface Emote {
  id: string;
  name: string;
  previewUrl: string;
}

export const AdminView = () => {
  const { gameState } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);
  const typedGameState = gameState as GameState;
  
  const [isLoading, setIsLoading] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);
  const [emotesFetchError, setEmotesFetchError] = useState("");
  
  // Form fields
  const [selectedEmote, setSelectedEmote] = useState("");
  const [emoteDescription, setEmoteDescription] = useState("");
  const [password, setPassword] = useState("");
  const [availableEmotes, setAvailableEmotes] = useState<Emote[]>([]);

  // Load current settings and available emotes
  useEffect(() => {
    const fetchEmotes = async () => {
      try {
        setIsLoading(true);
        setEmotesFetchError("");
        
        const response = await backendAPI.get("/available-emotes");
        
        if (!response.data.success) {
          setEmotesFetchError("Failed to fetch available emotes");
          return;
        }
        
        setAvailableEmotes(response.data.emotes || []);
        
        // Set current values if they exist
        if (typedGameState?.unlockData) {
          setSelectedEmote(typedGameState.unlockData.emoteId || "");
          setEmoteDescription(typedGameState.unlockData.emoteDescription || "");
          setPassword(typedGameState.unlockData.password || "");
        }
      } catch (error: any) {
        setEmotesFetchError("Error loading emotes: " + (error.message || "Unknown error"));
        setErrorMessage(dispatch, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmotes();
  }, [typedGameState, dispatch]);

  const handleSave = async () => {
    if (!selectedEmote || !password.trim()) {
      window.parent.postMessage({ 
        type: "showToast", 
        title: "Missing Information", 
        description: "Please select an emote and set a password"
      }, "*");
      return;
    }

    setIsLoading(true);
    try {
      const response = await backendAPI.post("/emote-unlock/config", {
        emoteId: selectedEmote,
        emoteDescription: emoteDescription.trim(),
        password: password.trim().toLowerCase()
      });
      
      setGameState(dispatch, response.data);
      
      window.parent.postMessage({ 
        type: "showToast", 
        title: "Configuration Saved", 
        description: "The emote unlock has been configured successfully"
      }, "*");
      
      // Reset engagement data visibility after save
      setShowEngagement(false);
    } catch (error: any) {
      window.parent.postMessage({ 
        type: "showToast", 
        title: "Error Saving Configuration", 
        description: error.message || "An unexpected error occurred"
      }, "*");
      setErrorMessage(dispatch, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/*<h1 className="text-2xl font-bold mb-6">Admin Settings</h1>*/}
      
      {/* Configuration Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <p className="mb-6 text-gray-600">
          Allow users to unlock an emote when they successfully answer a question or enter the correct password.
        </p>
        
        <div className="space-y-6">
          {/* Emote Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Choose an emote to unlock</label>
            
            {emotesFetchError ? (
              <div className="text-red-500 mb-2">{emotesFetchError}</div>
            ) : null}
            
            <select 
              value={selectedEmote}
              onChange={(e) => setSelectedEmote(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isLoading || availableEmotes.length === 0}
            >
              <option value="">Select an emote</option>
              {availableEmotes.map(emote => (
                <option key={emote.id} value={emote.id}>
                  {emote.name}
                </option>
              ))}
            </select>
            
            {availableEmotes.length === 0 && !emotesFetchError && !isLoading && (
              <p className="text-amber-600 text-sm mt-1">No unlockable emotes found. Please contact support.</p>
            )}
          </div>
          
          {/* Preview if emote selected */}
          {selectedEmote && availableEmotes.length > 0 && (
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={availableEmotes.find(e => e.id === selectedEmote)?.previewUrl || ""}
                  alt="Emote preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-medium">
                  {availableEmotes.find(e => e.id === selectedEmote)?.name || "Selected Emote"}
                </h3>
                <p className="text-sm text-gray-500">Emote ID: {selectedEmote}</p>
              </div>
            </div>
          )}
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter a description or question to prompt users to the correct answer
            </label>
            <textarea
              value={emoteDescription}
              onChange={(e) => setEmoteDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
              placeholder="Example: were you naughty before Christmas?"
              disabled={isLoading}
            ></textarea>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose a password or answer. We recommend 1-2 words. Answers are not case sensitive.
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Example: i was a bad boy"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      
      {/* Engagement Section */}
      <div className="mb-8">
        <button 
          className="flex items-center justify-between w-full p-4 bg-white rounded-lg shadow-sm"
          onClick={() => setShowEngagement(!showEngagement)}
        >
          <h2 className="text-xl font-semibold">Engagement</h2>
          <span>{showEngagement ? "▲" : "▼"}</span>
        </button>
        
        {showEngagement && typedGameState?.unlockData?.stats && (
          <div className="p-6 bg-white rounded-b-lg shadow-sm border-t">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold mb-1">
                  {typedGameState.unlockData.stats.attempts || 0}
                </div>
                <div className="text-sm text-gray-600">Users who attempted</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold mb-1">
                  {typedGameState.unlockData.stats.successfulUnlocks || 0}
                </div>
                <div className="text-sm text-gray-600">Users who successfully unlocked</div>
              </div>
            </div>
            
            {typedGameState.unlockData.stats.unlockUsers && typedGameState.unlockData.stats.unlockUsers.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-3">Users who unlocked this emote</h3>
                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-2">
                  <ul className="divide-y divide-gray-200">
                    {typedGameState.unlockData.stats.unlockUsers.map((user, index) => (
                      <li key={index} className="py-2 px-1">
                        {user.displayName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">No users have unlocked this emote yet</p>
            )}
          </div>
        )}
      </div>
      
      <PageFooter>
        <button 
          className="btn btn-primary" 
          disabled={isLoading} 
          onClick={handleSave}
        >
          {isLoading ? "Saving..." : "Save Configuration"}
        </button>
      </PageFooter>
    </div>
  );
};

export default AdminView;
