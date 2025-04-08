import { Request, Response } from "express";
import { 
  DroppedAsset, 
  errorHandler, 
  getCredentials, 
  initializeDroppedAssetDataObject 
} from "../../utils/index";
import { IDroppedAsset } from "../../types/DroppedAssetInterface";

export const handleEmoteUnlockConfig = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug } = credentials;
    const { emoteDescription, password } = req.body;
    
    // Basic validation
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required" 
      });
    }
    
    // Get the asset data
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    // Initialize data object if needed
    await initializeDroppedAssetDataObject(droppedAsset as IDroppedAsset);
    
    // Get the current data object
    const dataObject = (droppedAsset as any).dataObject || {};
    
    // Reset stats when config changes
    const unlockData = {
      emoteId: "eyes",
      emoteName: "Eyes",
      emotePreviewUrl: "https://sdk-style.s3.amazonaws.com/icons/eyes.svg",
      emoteDescription: emoteDescription || "Enter the correct password to unlock the Eyes expression!",
      password: password.trim().toLowerCase(),
      stats: {
        attempts: 0,
        successfulUnlocks: 0,
        unlockUsers: []
      }
    };
    
    // Update the data object
    await (droppedAsset as any).setDataObject({
      ...dataObject,
      unlockData
    });
    
    return res.json({
      unlockData: {
        ...unlockData
      },
      success: true
    });
    
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleEmoteUnlockConfig",
      message: "Error configuring emote unlock",
      req,
      res,
    });
  }
}; 