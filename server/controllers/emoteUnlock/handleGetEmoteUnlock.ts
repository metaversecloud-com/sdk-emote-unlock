import { Request, Response } from "express";
import { 
  DroppedAsset, 
  errorHandler, 
  getCredentials, 
  initializeDroppedAssetDataObject 
} from "../../utils/index.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface";

export const handleGetEmoteUnlock = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;
    
    //get the asset data
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    //initialize data object if needed
    await initializeDroppedAssetDataObject(droppedAsset as IDroppedAsset);
    
    //get the data object to check if it has unlock data
    const dataObject = (droppedAsset as any).dataObject || {};
    
    //prep the response
    const unlockData = dataObject.unlockData || {
      emoteId: "",
      emoteName: "",
      emotePreviewUrl: "",
      emoteDescription: "",
      password: "", //only sent to admin
      stats: {
        attempts: 0,
        successfulUnlocks: 0,
        unlockUsers: []
      }
    };
    
    //check if user has already unlocked the emote
    let isEmoteUnlocked = false;
    if (unlockData.stats && unlockData.stats.unlockUsers) {
      isEmoteUnlocked = unlockData.stats.unlockUsers.some((user: any) => user.visitorId === visitorId);
    }
    
    //in theory this should work but if its an admin it should see the password
    const isAdmin = req.query.isAdmin === "true";
    if (!isAdmin && unlockData) {
      delete unlockData.password;
    }
    
    return res.json({ 
      unlockData,
      isEmoteUnlocked,
      success: true 
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetEmoteUnlock",
      message: "Error getting emote unlock data",
      req,
      res,
    });
  }
}; 