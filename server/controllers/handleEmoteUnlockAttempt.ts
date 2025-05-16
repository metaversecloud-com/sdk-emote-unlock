import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, getVisitor } from "../utils/index.js";

export const handleEmoteUnlockAttempt = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, displayName } = credentials;
    const { password } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);

    const unlockData = droppedAsset.dataObject;

    // Update attempt stats
    unlockData.stats.attempts = (unlockData.stats.attempts || 0) + 1;

    const visitor = await getVisitor(credentials);

    // Check if password matches
    const isCorrectPassword = password.trim().toLowerCase() === unlockData.password.trim().toLowerCase();

    if (!password || !isCorrectPassword) {
      await droppedAsset.updateDataObject({ unlockData });

      return res.status(400).json({
        success: false,
        message: "Oops! That's not right. Try again!",
      });
    }

    console.log("Attempting to grant expression with the following data:", {
      emoteId: unlockData.emoteId,
      emoteName: unlockData.emoteName,
    });
    let grantExpressionResponse = await visitor
      .grantExpression({
        id: unlockData.emoteId,
      })
      .catch(async (error: any) => {
        console.log("Unlock with emoteId failed", error.message);

        grantExpressionResponse = await visitor
          .grantExpression({
            name: unlockData.emoteName,
          })
          .catch((error: any) => {
            console.log("Unlock with emoteName failed:", error.message);
            return errorHandler({
              error,
              functionName: "handleGetEmoteUnlock",
              message: "Error attempting to unlock emote",
              req,
              res,
            });
          });
      });

    if (grantExpressionResponse.status === 200) {
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

      // Update stats
      unlockData.stats.successfulUnlocks += 1;
      if (!unlockData.stats.unlockUsers) {
        unlockData.stats.unlockUsers = [];
      }
      unlockData.stats.unlockUsers.push({
        visitorId,
        displayName,
        unlockedAt: new Date().toISOString(),
      });

      await droppedAsset.updateDataObject(unlockData);
    } else if (grantExpressionResponse.status === 409) {
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
    }
    return res.json({
      unlockData,
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
