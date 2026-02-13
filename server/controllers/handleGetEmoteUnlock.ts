import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, getVisitor } from "../utils/index.js";

export const handleGetEmoteUnlock = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;

    const droppedAsset = await getDroppedAsset(credentials);
    const dataObject = droppedAsset.dataObject;

    // Backwards compatibility: detect unlock type
    const unlockType = dataObject.unlockType || (dataObject.emoteId ? "emote" : null);
    const itemId = dataObject.itemId || dataObject.emoteId;
    const itemName = dataObject.itemName || dataObject.emoteName;
    const itemDescription = dataObject.itemDescription || dataObject.emoteDescription;
    const itemPreviewUrl = dataObject.itemPreviewUrl || dataObject.emotePreviewUrl;

    const isItemUnlocked = dataObject?.stats?.successfulUnlocks[profileId];

    const visitor = await getVisitor(credentials);

    // Remove answer data for non-admin users
    const isAdmin = visitor.isAdmin;
    if (!isAdmin) {
      delete dataObject.password;
      delete dataObject.correctAnswers;
    }

    visitor.updateDataObject(
      {},
      {
        analytics: [{ analyticName: "starts", uniqueKey: profileId }],
      },
    );

    // Determine default icon
    const defaultIcon = unlockType === "accessory" ? `/default-accessory-icon.svg` : `/default-emote-icon.svg`;

    return res.json({
      unlockData: {
        ...dataObject,
        // New fields (always present)
        unlockType,
        itemId,
        itemName,
        itemDescription,
        itemPreviewUrl: itemPreviewUrl || defaultIcon,
        isItemUnlocked,
        // Legacy fields for backwards compatibility
        emoteId: itemId,
        emoteName: itemName,
        emoteDescription: itemDescription,
        emotePreviewUrl: itemPreviewUrl || defaultIcon,
        isEmoteUnlocked: isItemUnlocked,
      },
      isAdmin,
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetEmoteUnlock",
      message: "Error getting unlock data",
      req,
      res,
    });
  }
};
