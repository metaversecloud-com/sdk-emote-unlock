import { useState, useContext, useEffect } from "react";

//context
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, QuestionType } from "@/context/types";

//utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { Loading } from "./Loading";
import { useSearchParams } from "react-router-dom";

interface Emote {
  id: string;
  name: string;
  previewUrl: string;
}

interface AccessoryPackItem {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
}

interface AccessoryPack {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  packId: string;
  accessories: AccessoryPackItem[];
}

type UnlockType = "emote" | "accessory";

export const AdminView = () => {
  const { gameState } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);

  const [showEngagement, setShowEngagement] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const [searchParams] = useSearchParams();
  const forceRefreshInventory = searchParams.get("forceRefreshInventory") === "true";

  //form fields
  const [unlockType, setUnlockType] = useState<UnlockType>(gameState?.unlockType || "emote");
  const [selectedEmote, setSelectedEmote] = useState(gameState?.emoteId || "");
  const [selectedPackId, setSelectedPackId] = useState("");
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>(gameState?.accessoryIds || []);
  const [itemDescription, setItemDescription] = useState(
    gameState?.itemDescription || gameState?.emoteDescription || "",
  );
  const [password, setPassword] = useState(gameState?.password || "");
  const [availableEmotes, setAvailableEmotes] = useState<Emote[]>([]);
  const [availablePacks, setAvailablePacks] = useState<AccessoryPack[]>([]);

  // Question type fields
  const [questionType, setQuestionType] = useState<QuestionType>(gameState?.questionType || "text");
  const [options, setOptions] = useState<string[]>(gameState?.options || ["", ""]);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(gameState?.correctAnswers || []);

  //load current settings and available items
  useEffect(() => {
    const fetchItems = async () => {
      await backendAPI
        .get("/unlockables", { params: { forceRefreshInventory } })
        .then((response) => {
          setAvailableEmotes(response.data.emotes || []);
          setAvailablePacks(response.data.packs || []);
          setErrorMessage(dispatch, undefined);
        })
        .catch((error: ErrorType) => {
          setErrorMessage(dispatch, error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchItems();
  }, [gameState, dispatch]);

  const selectedPack = availablePacks.find((p) => p.id === selectedPackId);
  const packAccessories = selectedPack?.accessories || [];

  const toggleAccessory = (id: string) => {
    setSelectedAccessoryIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const selectAllAccessories = () => {
    setSelectedAccessoryIds(packAccessories.map((a) => a.id));
  };

  const deselectAllAccessories = () => {
    setSelectedAccessoryIds([]);
  };

  // Options builder helpers
  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectAnswers((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  const handleToggleCorrect = (index: number) => {
    if (questionType === "multiple_choice") {
      setCorrectAnswers([index]);
    } else {
      setCorrectAnswers((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    }
  };

  const handleSave = async () => {
    // Validation: item selection
    if (unlockType === "emote" && !selectedEmote) {
      return setErrorMessage(dispatch, "Please select an emote");
    }
    if (unlockType === "accessory" && !selectedAccessoryIds.length) {
      return setErrorMessage(dispatch, "Please select at least one accessory");
    }

    // Validation: answer (open_text needs no answer)
    if (questionType === "open_text") {
      // No validation needed
    } else if (questionType === "text") {
      if (!password.trim()) {
        return setErrorMessage(dispatch, "Please set an answer");
      }
    } else {
      const nonEmptyOptions = options.filter((o) => o.trim() !== "");
      if (nonEmptyOptions.length < 2) {
        return setErrorMessage(dispatch, "Please add at least 2 answer options");
      }
      if (options.some((o) => o.trim() === "")) {
        return setErrorMessage(dispatch, "All options must have text");
      }
      if (correctAnswers.length === 0) {
        return setErrorMessage(dispatch, "Please mark at least one correct answer");
      }
    }

    // Build request body based on type
    const selectedEmoteObject = unlockType === "emote" ? availableEmotes.find((e) => e.id === selectedEmote) : null;

    const selectedAccessoryObjects =
      unlockType === "accessory" ? packAccessories.filter((a) => selectedAccessoryIds.includes(a.id)) : [];

    const unlockCondition =
      questionType === "open_text"
        ? { type: "open_text" }
        : questionType === "text"
          ? { type: "text", value: password.trim().toLowerCase() }
          : { type: questionType, options: options.map((o) => o.trim()), correctAnswers };

    setAreButtonsDisabled(true);

    await backendAPI
      .post("/emote-unlock/config", {
        unlockType,
        selectedEmote: unlockType === "emote" ? selectedEmoteObject : undefined,
        selectedAccessories: unlockType === "accessory" ? selectedAccessoryObjects : undefined,
        selectedPack: unlockType === "accessory" ? selectedPack : undefined,
        itemDescription: itemDescription.trim(),
        unlockCondition,
      })
      .then((response) => {
        setGameState(dispatch, response.data.unlockData);
        setShowEngagement(false);
        setErrorMessage(dispatch, undefined);
      })
      .catch((error: ErrorType) => {
        setErrorMessage(dispatch, error);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="stagger-children grid gap-4 font-body">
      {/* Header */}
      <div>
        <h2 className="text-lg">Configuration</h2>
        <p className="text-sm text-ink-soft mt-1">Set up an unlock challenge for your students.</p>
      </div>

      {/* Unlock Type */}
      <div className="admin-section grid gap-2">
        <label className="text-sm font-semibold text-secondary">Unlock Type</label>
        <select
          value={unlockType}
          onChange={(e) => {
            setUnlockType(e.target.value as UnlockType);
            setSelectedEmote("");
            setSelectedPackId("");
            setSelectedAccessoryIds([]);
          }}
          className="input-treasure"
          disabled={areButtonsDisabled}
        >
          <option value="emote">Emote</option>
          <option value="accessory">Avatar Accessory</option>
        </select>
      </div>

      {/* Item Selection */}
      {unlockType === "emote" ? (
        <div className="admin-section grid gap-2">
          <label className="text-sm font-semibold text-secondary">Emote</label>
          <select
            value={selectedEmote}
            onChange={(e) => setSelectedEmote(e.target.value)}
            className="input-treasure"
            disabled={areButtonsDisabled || availableEmotes.length === 0}
          >
            <option value="">Select an emote</option>
            {availableEmotes.map((emote) => (
              <option key={emote.id} value={emote.id}>
                {emote.name}
              </option>
            ))}
          </select>

          {selectedEmote && availableEmotes.length > 0 && (
            <div className="flex items-center gap-3 mt-1 p-3 bg-parchment rounded-xl">
              <img
                src={availableEmotes.find((e) => e.id === selectedEmote)?.previewUrl || ""}
                alt="Emote preview"
                className="w-10 h-10 object-contain"
              />
              <span className="font-medium text-sm">{availableEmotes.find((e) => e.id === selectedEmote)?.name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-section grid gap-3">
          {/* Pack selector */}
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-secondary">Accessory Pack</label>
            <select
              value={selectedPackId}
              onChange={(e) => {
                setSelectedPackId(e.target.value);
                setSelectedAccessoryIds([]);
              }}
              className="input-treasure"
              disabled={areButtonsDisabled || availablePacks.length === 0}
            >
              <option value="">Select a pack</option>
              {availablePacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} ({pack.accessories.length} items)
                </option>
              ))}
            </select>
          </div>

          {/* Accessory multi-select */}
          {selectedPack && packAccessories.length > 0 && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-secondary">
                  Accessories{" "}
                  <span className="font-normal text-ink-soft">
                    ({selectedAccessoryIds.length}/{packAccessories.length})
                  </span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                    onClick={selectAllAccessories}
                    disabled={areButtonsDisabled}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-ink-soft hover:text-ink transition-colors"
                    onClick={deselectAllAccessories}
                    disabled={areButtonsDisabled}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid gap-1.5 max-h-52 overflow-y-auto rounded-xl border border-warm-border p-2 bg-parchment">
                {packAccessories.map((acc) => (
                  <div
                    key={acc.id}
                    role="checkbox"
                    aria-checked={selectedAccessoryIds.includes(acc.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                      selectedAccessoryIds.includes(acc.id)
                        ? "bg-accent-glow border border-accent shadow-sm"
                        : "bg-surface border border-transparent hover:bg-warm-100"
                    }`}
                    onClick={() => !areButtonsDisabled && toggleAccessory(acc.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedAccessoryIds.includes(acc.id) ? "border-accent bg-accent" : "border-warm-border"
                      }`}
                    >
                      {selectedAccessoryIds.includes(acc.id) && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M2 5L4 7L8 3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <img
                      src={acc.previewUrl || "/default-accessory-icon.svg"}
                      alt={acc.name}
                      className="w-8 h-8 object-contain rounded"
                    />
                    <span className="text-sm font-medium">{acc.name}</span>
                    {acc.category && (
                      <span className="text-xs text-ink-soft ml-auto bg-warm-100 px-2 py-0.5 rounded-full">
                        {acc.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div className="admin-section grid gap-2">
        <label className="text-sm font-semibold text-secondary">Question / Description</label>
        <textarea
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          className="input-treasure"
          placeholder="e.g. What bird's heart beats 1000 times a minute?"
          disabled={areButtonsDisabled}
        />
      </div>

      {/* Question Type */}
      <div className="admin-section grid gap-2">
        <label className="text-sm font-semibold text-secondary">Question Type</label>
        <select
          value={questionType}
          onChange={(e) => {
            const newType = e.target.value as QuestionType;
            setQuestionType(newType);
            if (newType === "text" || newType === "open_text") {
              setOptions(["", ""]);
              setCorrectAnswers([]);
            } else {
              setPassword("");
            }
          }}
          className="input-treasure"
          disabled={areButtonsDisabled}
        >
          <option value="text">Text Input</option>
          <option value="open_text">Open Response (any answer unlocks)</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="all_that_apply">All That Apply</option>
        </select>
      </div>

      {/* Answer Section */}
      {questionType === "open_text" ? (
        <div
          className="admin-section flex items-center gap-3 py-3"
          style={{ background: "var(--color-accent-glow)", borderColor: "rgba(245, 203, 92, 0.3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
            <circle cx="9" cy="9" r="8" stroke="#F5CB5C" strokeWidth="1.5" fill="none" />
            <path d="M9 5V10M9 12.5V13" stroke="#D4A04A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-secondary">Users can type anything. Every response grants the unlock.</p>
        </div>
      ) : questionType === "text" ? (
        <div className="admin-section grid gap-2">
          <label className="text-sm font-semibold text-secondary">Answer</label>
          <p className="text-xs text-ink-soft">1-2 words recommended. Not case sensitive.</p>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-treasure"
            placeholder="e.g. hummingbird"
            disabled={areButtonsDisabled}
          />
        </div>
      ) : (
        <div className="admin-section grid gap-3">
          <div>
            <label className="text-sm font-semibold text-secondary">Answer Options</label>
            <p className="text-xs text-ink-soft mt-1">
              {questionType === "multiple_choice"
                ? "Add options and select the one correct answer."
                : "Add options and select all correct answers."}
            </p>
          </div>

          <div className="grid gap-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCorrect(index)}
                  disabled={areButtonsDisabled}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    correctAnswers.includes(index)
                      ? "border-success bg-success"
                      : "border-warm-border hover:border-success/50"
                  }`}
                  title="Mark as correct"
                >
                  {correctAnswers.includes(index) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="input-treasure flex-1"
                  placeholder={`Option ${index + 1}`}
                  disabled={areButtonsDisabled}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  disabled={areButtonsDisabled || options.length <= 2}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-soft
                             hover:text-primary hover:bg-primary-soft
                             disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-ink-soft
                             transition-colors"
                  title="Remove option"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3.5 3.5L10.5 10.5M3.5 10.5L10.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            disabled={areButtonsDisabled}
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors text-left"
          >
            + Add Option
          </button>

          {correctAnswers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-success bg-success-bg rounded-lg px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3.5 7L6 9.5L10.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Correct: {correctAnswers.map((i) => options[i] || `Option ${i + 1}`).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave} disabled={areButtonsDisabled} className="btn-treasure text-base mt-1">
        {areButtonsDisabled ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-loader" />
            Saving...
          </span>
        ) : (
          "Save Configuration"
        )}
      </button>

      {/* Engagement Section */}
      <div className="mt-2">
        <button
          className="flex items-center justify-between w-full p-4 bg-surface rounded-xl
                     border border-warm-border shadow-card
                     hover:shadow-card-hover transition-all duration-200"
          onClick={() => setShowEngagement(!showEngagement)}
        >
          <span className="font-body font-semibold text-secondary text-base">Engagement</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`text-ink-soft transition-transform duration-200 ${showEngagement ? "rotate-180" : ""}`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {showEngagement && (
          <div className="mt-3 stagger-children">
            {gameState ? (
              <div className="grid gap-3">
                {/* Config summary */}
                <div
                  className="admin-section"
                  style={{ background: "var(--color-accent-glow)", borderColor: "rgba(245, 203, 92, 0.3)" }}
                >
                  <p className="text-xs font-semibold text-secondary mb-3">Current Configuration</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface p-2.5 rounded-lg">
                      <div className="text-xs text-ink-soft">Type</div>
                      <div className="text-sm font-semibold capitalize">{gameState.unlockType || "emote"}</div>
                    </div>
                    <div className="bg-surface p-2.5 rounded-lg">
                      <div className="text-xs text-ink-soft">Item</div>
                      <div className="text-sm font-semibold">
                        {gameState.itemName || gameState.emoteName || "Not set"}
                      </div>
                    </div>
                    <div className="bg-surface p-2.5 rounded-lg">
                      <div className="text-xs text-ink-soft">Question Type</div>
                      <div className="text-sm font-semibold capitalize">
                        {(gameState.questionType || "text").replace(/_/g, " ")}
                      </div>
                    </div>
                    <div className="bg-surface p-2.5 rounded-lg">
                      <div className="text-xs text-ink-soft">Answer</div>
                      <div className="text-sm font-semibold" style={{ fontFamily: "monospace" }}>
                        {gameState.questionType === "open_text"
                          ? "Any response"
                          : gameState.questionType === "text" || !gameState.questionType
                            ? gameState.password || "Not set"
                            : gameState.correctAnswers && gameState.options
                              ? gameState.correctAnswers.map((i) => gameState.options![i]).join(", ")
                              : "Not set"}
                      </div>
                    </div>
                    {gameState.unlockType === "accessory" && gameState.accessoryNames ? (
                      <div className="col-span-2 bg-surface p-2.5 rounded-lg">
                        <div className="text-xs text-ink-soft">Accessories</div>
                        <div className="text-sm font-semibold">{gameState.accessoryNames.join(", ")}</div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Stats */}
                {gameState.stats && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="stat-card">
                      <div className="stat-value">{gameState.stats.attempts || 0}</div>
                      <div className="stat-label">Attempts</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {(gameState.stats.successfulUnlocks && Object.keys(gameState.stats.successfulUnlocks).length) ||
                          0}
                      </div>
                      <div className="stat-label">Unlocked</div>
                    </div>
                  </div>
                )}

                {/* Open text responses table */}
                {gameState.questionType === "open_text" &&
                  gameState.stats?.responses &&
                  Object.keys(gameState.stats.responses).length > 0 && (
                    <div className="admin-section">
                      <p className="text-xs font-semibold text-secondary mb-3">
                        Student Responses ({Object.keys(gameState.stats.responses).length})
                      </p>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-warm-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-parchment border-b border-warm-border sticky top-0">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-ink-soft">Student</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-ink-soft">Response</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(gameState.stats.responses)
                              .sort(
                                ([, a], [, b]) => new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime(),
                              )
                              .map(([id, entry]) => (
                                <tr
                                  key={id}
                                  className="border-b border-warm-border last:border-0 hover:bg-warm-100 transition-colors"
                                >
                                  <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">
                                    {entry.displayName}
                                  </td>
                                  <td className="px-3 py-2.5 text-ink-soft">{entry.response}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-sm text-ink-soft p-3">No configuration saved yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
