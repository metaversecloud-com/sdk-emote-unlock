import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, getVisitor } from "../utils/index.js";

export const handleGetEmoteUnlock = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;

    const droppedAsset = await getDroppedAsset(credentials);
    const dataObject = droppedAsset.dataObject;

    const isEmoteUnlocked = dataObject?.stats?.successfulUnlocks[profileId];

    const visitor = await getVisitor(credentials);

    //remove password for non-admin users
    const isAdmin = visitor.isAdmin;
    if (!isAdmin) delete dataObject.password;

    visitor.updateDataObject(
      {},
      {
        analytics: [{ analyticName: "starts", uniqueKey: profileId }],
      },
    );

    return res.json({
      unlockData: {
        ...dataObject,
        isEmoteUnlocked,
        emotePreviewUrl: dataObject.emotePreviewUrl || `/default-emote-icon.svg`,
      },
      isAdmin,
      success: true,
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
