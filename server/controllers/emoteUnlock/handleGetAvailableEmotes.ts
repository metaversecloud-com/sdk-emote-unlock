import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor } from "../../utils/index.js";

export const handleGetAvailableEmotes = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug } = credentials;

    try {
      //get the visitor
      const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

      //TODO: not sure if there is a call to get a list of available emotes, but for now we will just return a list of emotes (one..)
      const emotes = [
        {
          id: "eyes",
          name: "Eyes",
          previewUrl: "https://sdk-style.s3.amazonaws.com/icons/eyes.svg",
        },
      ];

      return res.json({
        emotes,
        success: true,
      });
    } catch (apiError) {
      console.error("Error fetching emotes:", apiError);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch emotes",
      });
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetAvailableEmotes",
      message: "Error getting available emotes",
      req,
      res,
    });
  }
};
