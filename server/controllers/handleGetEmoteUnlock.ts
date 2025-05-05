import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, getVisitor } from "../utils/index.js";

export const handleGetEmoteUnlock = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId } = credentials;

    const droppedAsset = await getDroppedAsset(credentials);
    const dataObject = droppedAsset.dataObject;

    const isEmoteUnlocked = dataObject?.stats?.unlockUsers.some((user: any) => user.visitorId === visitorId) || false;

    //debug: log the retrieved unlock data
    console.log("Retrieved emote unlock data:", {
      emoteId: dataObject.emoteId,
      emoteName: dataObject.emoteName,
      emoteDescription: dataObject.emoteDescription,
      isEmoteUnlocked,
    });

    const visitor = await getVisitor(credentials);

    //remove password for non-admin users
    const isAdmin = visitor.isAdmin;
    if (!isAdmin) delete dataObject.password;

    return res.json({
      unlockData: { ...dataObject, isEmoteUnlocked },
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
