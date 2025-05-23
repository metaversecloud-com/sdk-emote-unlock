import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, getVisitor } from "../utils/index.js";

export const handleEmoteUnlockAttempt = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { displayName, profileId } = credentials;
    const { password } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);

    const unlockData = droppedAsset.dataObject;

    const isCorrectPassword = password.trim().toLowerCase() === unlockData.password.trim().toLowerCase();

    if (!password || !isCorrectPassword) {
      await droppedAsset.updateDataObject({
        ["stats.attempts"]: (unlockData.stats.attempts || 0) + 1,
      });

      return res.status(400).json({
        success: false,
        message: "Oops! That's not right. Try again!",
      });
    }

    const visitor = await getVisitor(credentials);

    const grantExpressionResponse = await visitor
      .grantExpression({
        id: unlockData.emoteId,
      })
      .catch((error: any) => {
        console.log("Unlock with emoteId failed", error.message);
      });

    if (grantExpressionResponse.statusCode === 409) {
      visitor
        .fireToast({
          title: "Already Unlocked",
          text: "You've already unlocked this emote! Click on your avatar to use it.",
        })
        .catch((error: any) =>
          errorHandler({
            error,
            functionName: "handleEmoteUnlockAttempt",
            message: "Error firing toast",
          }),
        );
    } else {
      visitor
        .fireToast({
          title: "Congrats! Emote Unlocked",
          text: "You just unlocked a new emote! Click on your avatar to test it out.",
        })
        .catch((error: any) =>
          errorHandler({
            error,
            functionName: "handleEmoteUnlockAttempt",
            message: "Error firing toast",
          }),
        );

      visitor.triggerParticle({ name: "Sparkle", duration: 3 }).catch((error: any) =>
        errorHandler({
          error,
          functionName: "handleEmoteUnlockAttempt",
          message: "Error triggering particle effects",
        }),
      );

      await droppedAsset.updateDataObject({
        [`stats.successfulUnlocks.${profileId}`]: { displayName, unlockedAt: new Date().toISOString() },
      });
    }

    await droppedAsset.fetchDataObject();
    return res.json({
      unlockData: droppedAsset.dataObject,
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetEmoteUnlock",
      message: "Error attempt to unlock emote",
      req,
      res,
    });
  }
};
