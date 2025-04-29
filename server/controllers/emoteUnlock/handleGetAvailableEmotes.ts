import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor } from "../../utils/index.js";

interface Expression {
  id: string;
  name: string;
  previewUrl?: string;
}

export const handleGetAvailableEmotes = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug } = credentials;
    
    try {
      // Get the visitor
      const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
      
      // Get available expressions using the new SDK method
      const availableExpressions = await visitor.getExpressions({ getUnlockablesOnly: true }) as Expression[];
      
      // Map the expressions to our expected format, preserving the original ID
      const emotes = availableExpressions.map(expression => ({
        id: expression.id,
        name: expression.name,
        type: expression.type, 
        previewUrl: expression.previewUrl || `/default-emote-icon.svg`
      }));
      
      return res.json({
        emotes,
        success: true
      });
      
    } catch (apiError) {
      console.error("Error fetching emotes:", apiError);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch emotes"
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