import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";

export const handleEmoteUnlockConfig = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { selectedEmote, unlockCondition, emoteDescription } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);

    if (!selectedEmote || !unlockCondition) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const unlockData = {
      emoteId: selectedEmote.id,
      emoteName: selectedEmote.name,
      emoteDescription: selectedEmote.description || emoteDescription,
      emotePreviewUrl: selectedEmote.previewUrl || `/default-emote-icon.svg`,
      password: unlockCondition.value.toString().trim().toLowerCase(),
      stats: {
        attempts: 0,
        successfulUnlocks: {},
      },
    };

    await droppedAsset.updateDataObject(unlockData);

    return res.json({
      unlockData,
      success: true,
      message: "Emote unlock configuration saved successfully",
    });
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
