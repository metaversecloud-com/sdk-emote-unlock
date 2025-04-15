import { Request, Response } from "express";
import {
  DroppedAsset,
  Visitor,
  World,
  errorHandler,
  getCredentials,
  initializeDroppedAssetDataObject,
} from "../../utils/index.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface";

export const handleEmoteUnlockAttempt = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId, displayName } = credentials;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    //getting the asset data to check if the password is correct
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    //initialize data object if needed
    await initializeDroppedAssetDataObject(droppedAsset as IDroppedAsset);

    //get the data object
    const dataObject = (droppedAsset as any).dataObject || {};
    const unlockData = dataObject.unlockData || {};

    //having stats in the data object to track attempts and successful unlocks and useful info we might need`
    if (!unlockData.stats) {
      unlockData.stats = { attempts: 0, successfulUnlocks: 0, unlockUsers: [] };
    }
    unlockData.stats.attempts = (unlockData.stats.attempts || 0) + 1;

    //check if user has already unlocked
    const userHasUnlocked =
      unlockData.stats.unlockUsers && unlockData.stats.unlockUsers.some((user: any) => user.visitorId === visitorId);

    //check if password matches
    const isCorrectPassword =
      unlockData.password && password.trim().toLowerCase() === unlockData.password.trim().toLowerCase();

    if (isCorrectPassword) {
      //if user has not already unlocked, add to list and increment successful unlocks
      if (!userHasUnlocked) {
        if (!unlockData.stats.unlockUsers) {
          unlockData.stats.unlockUsers = [];
        }

        unlockData.stats.unlockUsers.push({
          visitorId,
          displayName,
          unlockedAt: new Date().toISOString(),
        });

        unlockData.stats.successfulUnlocks = (unlockData.stats.successfulUnlocks || 0) + 1;

        //GIVE THE EMOTE TO THE USERR
        try {
          const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

          //grant the emote to the visitor
          await visitor.grantExpression({ name: "Eyes" });

          //TODO: idk if this works, only triggered if emote is granted
          try {
            const world = World.create(urlSlug, { credentials });
            await visitor.triggerParticle({
              name: "Sparkle",
              duration: 3,
            });
          } catch (particleError) {
            console.error("Failed to trigger particle effect:", particleError);
          }
        } catch (visitorError) {
          console.error("Failed to grant expression to user:", visitorError);
        }
      }

      //update the data object
      await (droppedAsset as any).setDataObject({
        ...dataObject,
        unlockData,
      });

      return res.json({
        success: true,
        alreadyUnlocked: userHasUnlocked,
      });
    }

    //update stats if password is incorrect
    await (droppedAsset as any).setDataObject({
      ...dataObject,
      unlockData,
    });

    return res.json({
      success: false,
      message: "Incorrect password",
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleEmoteUnlockAttempt",
      message: "Error processing emote unlock attempt",
      req,
      res,
    });
  }
};
