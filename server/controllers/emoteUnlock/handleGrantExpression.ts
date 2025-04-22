import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor, World } from "../../utils/index.js";

interface EmoteUnlockConfig {
  emoteId: string;
  emoteName: string;
  emoteDescription: string;
  emotePreviewUrl: string;
  unlockCondition: {
    type: string;
    value: string | number;
  };
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

export const handleGrantExpression = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug, displayName } = credentials;

    try {
      // Get the visitor
      const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

      // Get the unlock data from the world data object instead
      const world = await World.create(urlSlug, { credentials });
      await world.fetchDataObject();
      const worldData = world.dataObject as any;
      const unlockData = worldData?.unlockData as EmoteUnlockConfig;

      if (!unlockData) {
        return res.status(404).json({
          success: false,
          message: "No emote unlock configuration found"
        });
      }

      // Check if user has already unlocked
      const hasUnlocked = unlockData.stats.unlockUsers.some(user => user.visitorId === visitorId.toString());
      if (hasUnlocked) {
        return res.json({
          success: true,
          message: "Expression already granted",
          alreadyUnlocked: true
        });
      }

      // Grant the expression using the stored ID
      await visitor.grantExpression({ 
        id: unlockData.emoteId 
      });

      // Update stats
      unlockData.stats.successfulUnlocks += 1;
      unlockData.stats.unlockUsers.push({
        visitorId: visitorId.toString(),
        displayName,
        unlockedAt: new Date().toISOString()
      });

      // Save updated stats
      await visitor.setDataObject({
        key: "emoteUnlockData",
        value: unlockData
      });

      // Try to trigger particle effect
      try {
        await visitor.triggerParticle({ 
          name: "Sparkle", 
          duration: 3 
        });
      } catch (particleError) {
        console.error("Failed to trigger particle effect:", particleError);
      }

      return res.json({
        success: true,
        message: `Successfully granted expression: ${unlockData.emoteName}`
      });

    } catch (apiError) {
      console.error("Error granting expression:", apiError);
      return res.status(500).json({
        success: false,
        message: "Unable to grant expression"
      });
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGrantExpression",
      message: "Error granting expression",
      req,
      res,
    });
  }
}; 