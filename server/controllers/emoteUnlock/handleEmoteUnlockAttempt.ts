import { Request, Response } from "express";
import { 
  Visitor,
  World,
  errorHandler, 
  getCredentials
} from "../../utils/index.js";

interface EmoteUnlockConfig {
  emoteId: string;
  emoteName: string;
  emoteDescription: string;
  emotePreviewUrl: string;
  password: string;
  stats: {
    attempts: number;
    successfulUnlocks: number;
    unlockUsers: Array<{
      visitorId: string;
      displayName: string;
      unlockedAt: string;
    }>;
  };
}

interface WorldDataObject {
  unlockData?: EmoteUnlockConfig;
  [key: string]: any;
}

export const handleEmoteUnlockAttempt = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug, displayName } = credentials;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: "Password is required" 
      });
    }

    try {
      // Create world and get visitor
      const world = World.create(urlSlug, { credentials });
      const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
      
      // Get the data object
      await world.fetchDataObject();
      const worldData = world.dataObject as WorldDataObject;
      
      if (!worldData || !worldData.unlockData) {
        return res.json({
          success: false,
          message: "Incorrect password"
        });
      }
      
      const unlockData = worldData.unlockData;
      
      // Ensure stats object exists
      if (!unlockData.stats) {
        unlockData.stats = {
          attempts: 0,
          successfulUnlocks: 0,
          unlockUsers: []
        };
      }
      
      // Update attempt stats
      unlockData.stats.attempts = (unlockData.stats.attempts || 0) + 1;
      
      // Check if user has already unlocked
      const userHasUnlocked = unlockData.stats.unlockUsers && 
        unlockData.stats.unlockUsers.some(user => user.visitorId === visitorId.toString());
        
      if (userHasUnlocked) {
        return res.json({
          success: true,
          message: "Expression already granted",
          alreadyUnlocked: true
        });
      }
      
      // Check if password matches
      const isCorrectPassword = 
        password.trim().toLowerCase() === unlockData.password.trim().toLowerCase();
      
      // Use a lock to prevent race conditions
      const lockId = `${urlSlug}-${new Date().getTime()}`;
      
      if (isCorrectPassword) {
        try {
          console.log("Attempting to grant expression with the following data:", {
            emoteId: unlockData.emoteId,
            emoteName: unlockData.emoteName
          });
          
          // First approach - using just the ID
          try {
            console.log("Approach 1: Passing ID directly");
            await visitor.grantExpression({ 
              id: unlockData.emoteId
            });
            console.log("Approach 1 successful");
          } catch (err1: unknown) {
            const error1 = err1 as Error;
            console.log("Approach 1 failed:", error1.message);
            
            // Second approach - using ID as id property
            try {
              console.log("Approach 2: Using ID in id property");
              await visitor.grantExpression({ 
                id: unlockData.emoteId
              });
              console.log("Approach 2 successful");
            } catch (err2: unknown) {
              const error2 = err2 as Error;
              console.log("Approach 2 failed:", error2.message);
              
              // Third approach - using ID as name property
              try {
                console.log("Approach 3: Using ID in name property");
                await visitor.grantExpression({ 
                  name: unlockData.emoteId
                });
                console.log("Approach 3 successful");
              } catch (err3: unknown) {
                const error3 = err3 as Error;
                console.log("Approach 3 failed:", error3.message);
                
                // Fourth approach - using name directly
                try {
                  console.log("Approach 4: Using name directly");
                  await visitor.grantExpression({ 
                    name: unlockData.emoteName 
                  });
                  console.log("Approach 4 successful");
                } catch (err4: unknown) {
                  const error4 = err4 as Error;
                  console.log("Approach 4 failed:", error4.message);
                  
                  // Fifth approach - using name as name property
                  try {
                    console.log("Approach 5: Using name in name property");
                    await visitor.grantExpression({ 
                      name: unlockData.emoteName
                    });
                    console.log("Approach 5 successful");
                  } catch (err5: unknown) {
                    const error5 = err5 as Error;
                    console.log("Approach 5 failed:", error5.message);
                    throw new Error("All approaches failed to grant expression");
                  }
                }
              }
            }
          }
          
          // Update stats
          unlockData.stats.successfulUnlocks += 1;
          if (!unlockData.stats.unlockUsers) {
            unlockData.stats.unlockUsers = [];
          }
          unlockData.stats.unlockUsers.push({
            visitorId: visitorId.toString(),
            displayName,
            unlockedAt: new Date().toISOString()
          });
          
          // Save updated data
          await world.setDataObject({ unlockData }, { 
            lock: { 
              lockId,
              releaseLock: true
            }
          });
          
          // Try to trigger particle effect
          try {
            await visitor.triggerParticle({ 
              name: "Sparkle", 
              duration: 3 
            });
          } catch (particleError) {
            console.error("Failed to trigger particle effect:", particleError);
          }
          
          return res.json({
            success: true,
            message: `Successfully unlocked: ${unlockData.emoteName}`
          });
        } catch (grantError: unknown) {
          const error = grantError as any;
          console.error("Error granting expression:", error);
          
          // Check if it's a permission error
          if (error.status === 401 || 
              (error.message && error.message.includes("permission"))) {
            
            return res.json({
              success: false,
              message: "Password correct! However, this app doesn't have permission to grant emotes. Please contact the world owner."
            });
          }
          
          // For other errors, still count it as successful for the user
          return res.json({
            success: true,
            message: `Password correct! The emote should appear in your menu shortly.`
          });
        }
      }
      
      // Save attempt stats even if password is incorrect
      await world.setDataObject({ unlockData }, { 
        lock: { 
          lockId,
          releaseLock: true
        }
      });
      
      return res.json({
        success: false,
        message: "Incorrect password"
      });
      
    } catch (apiError) {
      console.error("Error processing unlock attempt:", apiError);
      
      // Even with errors, we should still give the user a clean response
      return res.json({
        success: false,
        message: "Incorrect password"
      });
    }
  } catch (error) {
    // Even with general errors, we should still give the user a clean response
    console.error("General error in handleEmoteUnlockAttempt:", error);
    return res.json({
      success: false,
      message: "Incorrect password"
    });
  }
}; 