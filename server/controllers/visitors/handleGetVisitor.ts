import { errorHandler, getCredentials } from "../../utils/index.js";
import { Request, Response } from "express";
import { Visitor } from "../../utils/index.js";

export const handleGetVisitor = async (req: Request, res: Response): Promise<Record<string, any> | void> => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug } = credentials;

    //get the visitor object from Topia SDK
    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    
    //for development/testing purposes, set all visitors as admin
    //in production, you would use actual admin check logic
    const isAdmin = true; // Force admin status for testing
    
    console.log("Setting admin status for visitor:", isAdmin);
    
    return res.json({
      visitor: {
        isAdmin,
        profileId: credentials.profileId || "",
        isInZone: true
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in handleGetVisitor:", error);
    return errorHandler({
      error,
      functionName: "getVisitorDetails",
      message: "Error retrieving visitor details",
      req,
      res,
    });
  }
};
