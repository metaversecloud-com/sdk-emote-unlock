import { Request, Response } from "express";
import { 
  DroppedAsset, 
  errorHandler, 
  getCredentials, 
  initializeDroppedAssetDataObject,
  World
} from "../../utils/index.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";

export const handleGetEmoteUnlock = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;
    
    //initialize default emote data structure
    let unlockData = {
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
    
    let isEmoteUnlocked = false;
    
    try {
      //first try to get data from the droppedasset
      const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
      await initializeDroppedAssetDataObject(droppedAsset as IDroppedAsset);
      const assetDataObject = (droppedAsset as any).dataObject || {};
      
      if (assetDataObject.unlockData) {
        console.log("Found unlock data in DroppedAsset:", assetDataObject.unlockData);
        unlockData = {
          ...unlockData,
          ...assetDataObject.unlockData
        };
      }
      
      //then also try to get data from the world object
      try {
        const world = World.create(urlSlug, { credentials });
        await world.fetchDataObject();
        const worldData = world.dataObject as any;
        
        if (worldData && worldData.unlockData) {
          console.log("Found unlock data in World object:", worldData.unlockData);
          //merge the data, prioritizing world data
          unlockData = {
            ...unlockData,
            ...worldData.unlockData
          };
        }
      } catch (worldError) {
        console.error("Error fetching World data:", worldError);
      }
      
      //check if user has already unlocked the emote
      if (unlockData.stats && unlockData.stats.unlockUsers) {
        isEmoteUnlocked = unlockData.stats.unlockUsers.some((user: any) => user.visitorId === visitorId);
      }
    } catch (error) {
      console.error("Error fetching emote data:", error);
    }
    
    //debug: log the retrieved unlock data
    console.log("Retrieved emote unlock data:", {
      emoteId: unlockData.emoteId,
      emoteName: unlockData.emoteName,
      emoteDescription: unlockData.emoteDescription,
      isEmoteUnlocked
    });
    
    //remove password for non-admin users
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