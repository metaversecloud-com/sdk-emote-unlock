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

    const expression = await visitor.getExpressions({ name: dataObject.emoteName });

    return res.json({
      unlockData: {
        ...dataObject,
        isEmoteUnlocked,
        emotePreviewUrl: expression[0].expressionImage || `/default-emote-icon.svg`,
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
