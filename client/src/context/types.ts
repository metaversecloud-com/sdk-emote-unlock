export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_GAME_STATE = "SET_GAME_STATE";
export const SET_ERROR = "SET_ERROR";
export const SET_VISITOR = "SET_VISITOR";

export type InteractiveParams = {
  assetId: string;
  displayName: string;
  identityId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export interface InitialState {
  error?: string;
  gameState?: GameStateType;
  hasInteractiveParams?: boolean;
  hasSetupBackend?: boolean;
  profileId?: string;
  visitor?: {
    isAdmin: boolean;
  };
}

export type ActionType = {
  type: string;
  payload: InitialState;
};

export type QuestionType = "text" | "open_text" | "multiple_choice" | "all_that_apply";

export type GameStateType = {
  // New generic fields
  unlockType?: "emote" | "accessory";
  itemId?: string;
  itemName?: string;
  itemPreviewUrl?: string;
  itemDescription?: string;
  isItemUnlocked?: boolean;

  // Accessory multi-select fields
  accessoryIds?: string[];
  accessoryNames?: string[];
  accessoryPreviewUrls?: string[];

  // Legacy fields (for backwards compatibility)
  emoteId?: string;
  emoteName?: string;
  emotePreviewUrl?: string;
  emoteDescription?: string;
  isEmoteUnlocked?: boolean;

  // Question/answer fields
  questionType?: QuestionType;
  password?: string;
  options?: string[];
  correctAnswers?: number[];
  stats?: {
    attempts?: number;
    successfulUnlocks?: { [profileId: string]: { unlockedAt: string; displayName?: string } };
    responses?: { [profileId: string]: { displayName: string; response: string; respondedAt: string } };
  };
};
