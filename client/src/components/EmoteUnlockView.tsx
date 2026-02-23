import { useState, useContext, KeyboardEvent, useMemo, useEffect } from "react";
import { GlobalStateContext, GlobalDispatchContext } from "@/context/GlobalContext";
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

const CONFETTI_COLORS = ["#D94F30", "#F5CB5C", "#1B4965", "#059669", "#E06B52", "#2A6F97"];

const WRONG_ANSWER_MESSAGES = [
  "Not quite! Give it another shot.",
  "So close! Try again.",
  "Hmm, that's not it. Keep going!",
  "Almost! One more try?",
  "Nope! But you've got this.",
  "Keep trying, you're getting warmer!",
];

const ConfettiCelebration = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${Math.random() * 0.6}s`,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      })),
    [],
  );

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            borderRadius: p.size > 10 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const StarIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="inline-block animate-star-burst">
    <path
      d="M24 4L29.5 17.5H44L32.5 26.5L36 40L24 32L12 40L15.5 26.5L4 17.5H18.5L24 4Z"
      fill="#F5CB5C"
      stroke="#E8B84B"
      strokeWidth="1.5"
    />
  </svg>
);

const EmoteUnlockView = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { gameState, profileId } = useContext(GlobalStateContext);

  // Extract with backwards compatibility
  const unlockType = gameState?.unlockType || "emote";
  const itemId = gameState?.itemId || gameState?.emoteId;
  const accessoryIds = gameState?.accessoryIds;
  const accessoryNames = gameState?.accessoryNames;
  const accessoryPreviewUrls = gameState?.accessoryPreviewUrls;
  const itemDescription = gameState?.itemDescription || gameState?.emoteDescription;
  const itemPreviewUrl = gameState?.itemPreviewUrl || gameState?.emotePreviewUrl;
  const stats = gameState?.stats;

  // Question type fields
  const questionType = gameState?.questionType || "text";
  const options = gameState?.options || [];

  const [password, setPassword] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wrongAttempt, setWrongAttempt] = useState<string | null>(null);
  const [shakeCard, setShakeCard] = useState(false);

  // Dynamic text based on unlock type
  const isAccessory = unlockType === "accessory";
  const itemTypeLabel = isAccessory ? "Accessory" : "Emote";
  const defaultIcon = isAccessory ? "/default-accessory-icon.svg" : "/default-emote-icon.svg";

  // Check if this unlock is configured
  const isConfigured = isAccessory ? accessoryIds && accessoryIds.length > 0 : itemId && itemId !== "";

  // Clear the wrong attempt message after a delay
  useEffect(() => {
    if (wrongAttempt) {
      const timer = setTimeout(() => setWrongAttempt(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [wrongAttempt]);

  const handleUnlockAttempt = async () => {
    if (questionType === "text" || questionType === "open_text") {
      if (!password.trim()) {
        setErrorMessage(dispatch, "Please enter a response");
        return;
      }
    } else {
      if (selectedAnswers.length === 0) {
        setErrorMessage(dispatch, "Please select an answer");
        return;
      }
    }

    setIsSubmitting(true);
    setWrongAttempt(null);

    const body =
      questionType === "text" || questionType === "open_text"
        ? { password: password.trim().toLowerCase() }
        : { selectedAnswers };

    await backendAPI
      .post("/emote-unlock/attempt", body)
      .then((response) => {
        setGameState(dispatch, response.data.unlockData);
        setPassword("");
        setSelectedAnswers([]);
        setErrorMessage(dispatch, undefined);
      })
      .catch((error) => {
        // Check if this is a wrong-answer 400 response
        const status = error?.response?.status;
        if (status === 400) {
          const msg = WRONG_ANSWER_MESSAGES[Math.floor(Math.random() * WRONG_ANSWER_MESSAGES.length)];
          setWrongAttempt(msg);
          setShakeCard(true);
          setTimeout(() => setShakeCard(false), 500);
          // Clear the generic error so the toast doesn't show
          setErrorMessage(dispatch, undefined);
        } else {
          setErrorMessage(dispatch, error);
        }
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

  if (!isConfigured) {
    return (
      <div className="card text-center py-10">
        <div className="text-4xl mb-3 opacity-40">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto">
            <rect x="8" y="24" width="40" height="28" rx="4" fill="#E2DDD5" stroke="#C4BFB7" strokeWidth="2" />
            <path
              d="M16 24V18C16 11.4 21.4 6 28 6C34.6 6 40 11.4 40 18V24"
              stroke="#C4BFB7"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="28" cy="38" r="3" fill="#C4BFB7" />
          </svg>
        </div>
        <h4 className="text-ink-soft mb-1">Not Available Yet</h4>
        <p className="text-sm text-ink-soft">This challenge is not available at this time. Check back later!</p>
      </div>
    );
  }

  const isUnlocked = Object.keys(stats?.successfulUnlocks ?? {}).includes(profileId!);

  return (
    <>
      {/* Title */}
      <h3 className="text-center text-xl mb-5">{itemTypeLabel} Unlock Challenge</h3>

      {!isUnlocked ? (
        <div
          className={`card flex flex-col gap-5 transition-transform ${shakeCard ? "animate-shake" : ""}`}
          style={shakeCard ? { animation: "shake 0.4s ease-in-out" } : undefined}
        >
          {/* Item preview */}
          {isAccessory && accessoryPreviewUrls && accessoryPreviewUrls.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {accessoryPreviewUrls.map((url, i) => (
                <div key={i} className="text-center">
                  <div className="treasure-frame">
                    <div className="treasure-frame-inner">
                      <img
                        src={url || defaultIcon}
                        alt={accessoryNames?.[i] || "Accessory"}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  </div>
                  {accessoryNames?.[i] && <p className="text-xs mt-2 font-medium text-ink-soft">{accessoryNames[i]}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="treasure-frame animate-gentle-pulse">
                <div className="treasure-frame-inner">
                  <img
                    src={itemPreviewUrl || defaultIcon}
                    alt={`${itemTypeLabel} preview`}
                    className="w-32 h-32 object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Question / Description */}
          <p className="text-center text-ink font-medium leading-relaxed" style={{ whiteSpace: "pre-line" }}>
            {itemDescription ||
              localStorage.getItem("emoteDescription") ||
              (questionType === "open_text"
                ? `Share your thoughts to unlock this ${itemTypeLabel.toLowerCase()}!`
                : `Enter the correct answer to unlock this ${itemTypeLabel.toLowerCase()}!`)}
          </p>

          {/* Answer input based on question type */}
          {questionType === "text" || questionType === "open_text" ? (
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={questionType === "open_text" ? "Type your response..." : "Type your answer..."}
              className="input-treasure text-center"
              disabled={isSubmitting}
            />
          ) : (
            <div className="grid gap-2.5">
              {options.map((option, index) => (
                <label key={index} className={`option-card ${selectedAnswers.includes(index) ? "selected" : ""}`}>
                  <input
                    type={questionType === "multiple_choice" ? "radio" : "checkbox"}
                    name="answer"
                    checked={selectedAnswers.includes(index)}
                    onChange={() => {
                      if (questionType === "multiple_choice") {
                        setSelectedAnswers([index]);
                      } else {
                        setSelectedAnswers((prev) =>
                          prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
                        );
                      }
                    }}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedAnswers.includes(index) ? "border-accent bg-accent" : "border-warm-border"
                    }`}
                  >
                    {selectedAnswers.includes(index) && (
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
                  </div>
                  <span className="font-medium text-sm">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Wrong answer feedback */}
          {wrongAttempt && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 animate-fade-up"
              style={{ background: "linear-gradient(135deg, #FFF5EB 0%, #FFF0E6 100%)", border: "1.5px solid #F5CB5C" }}
            >
              <span className="text-xl flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FFF3C4" stroke="#F5CB5C" strokeWidth="1.5" />
                  <circle cx="8.5" cy="10" r="1.2" fill="#D4A04A" />
                  <circle cx="15.5" cy="10" r="1.2" fill="#D4A04A" />
                  <path
                    d="M8.5 16C9.5 14.5 14.5 14.5 15.5 16"
                    stroke="#D4A04A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <p className="text-sm font-medium" style={{ color: "#8B6914" }}>
                {wrongAttempt}
              </p>
            </div>
          )}

          {/* Unlock button */}
          <button className="btn-treasure text-base" onClick={handleUnlockAttempt} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-loader" />
                Checking...
              </span>
            ) : (
              `Unlock ${itemTypeLabel}`
            )}
          </button>
        </div>
      ) : (
        /* ====== SUCCESS STATE ====== */
        <div
          className="relative card text-center py-10 overflow-hidden animate-bounce-in"
          style={{ background: "linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 50%, #FFF3C4 100%)" }}
        >
          <ConfettiCelebration />

          <div className="relative z-10">
            <div className="mb-4">
              <StarIcon />
            </div>

            <h3 className="pb-3 text-success">{isAccessory ? "Accessories" : "Emote"} Unlocked!</h3>

            <p className="text-sm text-ink-soft max-w-xs mx-auto leading-relaxed">
              {isAccessory
                ? `You've unlocked ${accessoryNames?.length || 1} new accessor${(accessoryNames?.length || 1) === 1 ? "y" : "ies"}! Customize your avatar to use them. You may need to reload the page to check out your new accessories.`
                : "You've unlocked this emote. Click on your avatar to use it!"}
            </p>
          </div>
        </div>
      )}

      {/* Stats badge */}
      {stats && (
        <div className="flex justify-center mt-6">
          <div className="stats-badge">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L8.5 5H13L9.5 7.5L10.5 11.5L7 9L3.5 11.5L4.5 7.5L1 5H5.5L7 1Z"
                fill="#F5CB5C"
                stroke="#E8B84B"
                strokeWidth="0.8"
              />
            </svg>
            {(stats.successfulUnlocks && Object.keys(stats.successfulUnlocks).length) || 0} users unlocked
          </div>
        </div>
      )}
    </>
  );
};

export default EmoteUnlockView;
