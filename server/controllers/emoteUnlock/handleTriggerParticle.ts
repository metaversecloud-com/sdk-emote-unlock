import { Request, Response } from "express";
import { 
  World, 
  Visitor,
  errorHandler, 
  getCredentials 
} from "../../utils/index";

export const handleTriggerParticle = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;
    const { name, duration, position } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Particle effect name is required"
      });
    }
    
    //get world instance
    const world = World.create(urlSlug, { credentials });
    
    try {
      //if position is provided, trigger particle at specific position
      if (position) {
        await world.triggerParticle({
          name,
          duration: duration || 3,
          position
        });
      } 
      //else, trigger on the visitor
      else {
        const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
        await visitor.triggerParticle({
          name,
          duration: duration || 3
        });
      }
      
      return res.json({
        success: true,
        message: `Particle effect "${name}" triggered successfully`
      });
    } catch (particleError: any) {
      console.error("Failed to trigger particle effect:", particleError);
      
      return res.status(500).json({
        success: false,
        message: "Failed to trigger particle effect",
        error: particleError.message || "Unknown error"
      });
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleTriggerParticle",
      message: "Error triggering particle effect",
      req,
      res,
    });
  }
}; 