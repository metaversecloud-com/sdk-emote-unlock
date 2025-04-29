import { Request, Response } from "express";
import { 
  errorHandler, 
  getCredentials, 
  Visitor,
  World
} from "../../utils/index.js";

interface EmoteUnlockConfig {
  emoteId: string;
  emoteName: string;
  emoteDescription: string;
  emotePreviewUrl: string;
  password: string;
  stats: {
    attempts: number;
    successfulUnlocks: number;
    unlockUsers: Array<{
      visitorId: string;
      displayName: string;
      unlockedAt: string;
    }>;
  };
}

export const handleEmoteUnlockConfig = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug } = credentials;
    const { selectedEmote, unlockCondition, emoteDescription } = req.body;

    if (!selectedEmote || !unlockCondition) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    try {
      // Create world instance
      const world = World.create(urlSlug, { credentials });

      // Initialize the unlock data with stats
      const unlockData: EmoteUnlockConfig = {
        emoteId: selectedEmote.id,
        emoteName: selectedEmote.name,
        emoteDescription: emoteDescription || "",
        emotePreviewUrl: selectedEmote.previewUrl || `https://sdk-style.s3.amazonaws.com/icons/${selectedEmote.name.toLowerCase()}.svg`,
        password: unlockCondition.value.toString().trim().toLowerCase(),
        stats: {
          attempts: 0,
          successfulUnlocks: 0,
          unlockUsers: []
        }
      };

      // Debug: log the data being saved
      console.log("Saving emote config with description:", emoteDescription);

      // Set data object with a unique lockId to prevent race conditions
      const lockId = `${urlSlug}-${new Date().getTime()}`;
      await world.setDataObject({ unlockData }, { 
        lock: { 
          lockId,
          releaseLock: true
        }
      });

      // Return the updated data in the response
      return res.json({
        unlockData,
        success: true,
        message: "Emote unlock configuration saved successfully"
      });

    } catch (apiError) {
      console.error("Error saving emote unlock config:", apiError);
      return res.status(500).json({
        success: false,
        message: "Unable to save emote unlock configuration"
      });
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleEmoteUnlockConfig",
      message: "Error saving emote unlock configuration",
      req,
      res,
    });
  }
}; 