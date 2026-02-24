import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, getVisitor, Ecosystem } from "../utils/index.js";

export const handleEmoteUnlockAttempt = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { displayName, profileId } = credentials;
    const { password, selectedAnswers } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);
    const unlockData = droppedAsset.dataObject as any;

    // Detect unlock type with backwards compatibility
    const unlockType = unlockData.unlockType || "emote";
    const itemId = unlockData.itemId || unlockData.emoteId;

    // Validate answer based on question type
    const questionType = unlockData.questionType || "text";
    let isCorrect = false;

    if (questionType === "open_text") {
      // Any non-empty response is accepted
      isCorrect = !!(password && password.trim());
    } else if (questionType === "text") {
      if (password && unlockData.password) {
        isCorrect = password.trim().toLowerCase() === unlockData.password.trim().toLowerCase();
      }
    } else if (questionType === "multiple_choice") {
      if (Array.isArray(selectedAnswers) && selectedAnswers.length === 1 && Array.isArray(unlockData.correctAnswers)) {
        isCorrect = selectedAnswers[0] === unlockData.correctAnswers[0];
      }
    } else if (questionType === "all_that_apply") {
      if (Array.isArray(selectedAnswers) && Array.isArray(unlockData.correctAnswers)) {
        const sortedSelected = [...selectedAnswers].sort();
        const sortedCorrect = [...unlockData.correctAnswers].sort();
        isCorrect =
          sortedSelected.length === sortedCorrect.length &&
          sortedSelected.every((val: number, idx: number) => val === sortedCorrect[idx]);
      }
    }

    // Increment attempts counter on every attempt (correct or incorrect)
    await droppedAsset.updateDataObject({
      ["stats.attempts"]: (unlockData.stats.attempts || 0) + 1,
    });

    if (!isCorrect) {
      await droppedAsset.updateDataObject(
        {},
        {
          analytics: [
            {
              analyticName: "false_responses",
              uniqueKey: profileId,
            },
          ],
        },
      );

      return res.status(400).json({
        success: false,
        message: "Oops! That's not right. Try again!",
      });
    }

    // Store open_text responses for admin review
    if (questionType === "open_text" && password) {
      await droppedAsset.updateDataObject({
        [`stats.responses.${profileId}`]: {
          displayName,
          response: password.trim(),
          respondedAt: new Date().toISOString(),
        },
      });
    }

    const analytics = [
      {
        analyticName: "completions",
        uniqueKey: profileId,
      },
    ];

    const visitor = await getVisitor(credentials);

    // Handle unlocking based on type
    if (unlockType === "emote") {
      // EMOTE UNLOCK LOGIC
      const grantExpressionResponse = await visitor
        .grantExpression({
          id: itemId,
        })
        .catch((error: any) => {
          console.error("Unlock with emoteId failed", error.message);
        });

      if (grantExpressionResponse?.statusCode === 409) {
        visitor
          .fireToast({
            title: "Already Unlocked",
            text: "You've already unlocked this emote! Click on your avatar to use it.",
          })
          .catch((error: any) =>
            errorHandler({
              error,
              functionName: "handleEmoteUnlockAttempt",
              message: "Error firing toast",
            }),
          );

        await droppedAsset.updateDataObject({}, { analytics });
      } else {
        visitor
          .fireToast({
            title: "Congrats! Emote Unlocked",
            text: "You just unlocked a new emote! Click on your avatar to test it out.",
          })
          .catch((error: any) =>
            errorHandler({
              error,
              functionName: "handleEmoteUnlockAttempt",
              message: "Error firing toast",
            }),
          );

        visitor.triggerParticle({ name: "Sparkle", duration: 3 }).catch((error: any) =>
          errorHandler({
            error,
            functionName: "handleEmoteUnlockAttempt",
            message: "Error triggering particle effects",
          }),
        );

        analytics.push({
          analyticName: "emote_granted",
          uniqueKey: profileId,
        });

        await droppedAsset.updateDataObject(
          {
            [`stats.successfulUnlocks.${profileId}`]: { displayName, unlockedAt: new Date().toISOString() },
          },
          { analytics },
        );
      }
    } else if (unlockType === "accessory") {
      // ACCESSORY UNLOCK LOGIC
      const accessoryIds: string[] = unlockData.accessoryIds || (unlockData.itemId ? [unlockData.itemId] : []);

      if (!accessoryIds.length) {
        return res.status(400).json({
          success: false,
          message: "No accessories configured for this unlock",
        });
      }

      // Fetch the full InventoryItems from the Ecosystem catalog
      const { visitorId, urlSlug, interactivePublicKey, interactiveNonce, assetId } = credentials;
      const ecosystem = Ecosystem.create({
        credentials: {
          interactivePublicKey,
          interactiveNonce,
          assetId,
          visitorId,
          urlSlug,
        },
      });
      await ecosystem.fetchInventoryItems();

      // Find all selected accessories in the catalog
      const inventoryItems = accessoryIds
        .map((id) => (ecosystem.inventoryItems as any[])?.find((item: any) => item.id === id))
        .filter(Boolean);

      if (!inventoryItems.length) {
        return res.status(404).json({
          success: false,
          message: "Accessories not found in inventory catalog",
        });
      }

      try {
        // Grant accessories sequentially to avoid API lock contention
        for (const item of inventoryItems) {
          await visitor.grantInventoryItem(item, 1);
        }

        const count = inventoryItems.length;
        visitor
          .fireToast({
            title: "Congrats! Accessories Unlocked",
            text: `You just unlocked ${count} new accessor${count === 1 ? "y" : "ies"}!`,
          })
          .catch((error: any) =>
            errorHandler({
              error,
              functionName: "handleEmoteUnlockAttempt",
              message: "Error firing toast",
            }),
          );

        visitor.triggerParticle({ name: "Sparkle", duration: 3 }).catch((error: any) =>
          errorHandler({
            error,
            functionName: "handleEmoteUnlockAttempt",
            message: "Error triggering particle effects",
          }),
        );

        analytics.push({
          analyticName: "accessory_granted",
          uniqueKey: profileId,
        });

        await droppedAsset.updateDataObject(
          {
            [`stats.successfulUnlocks.${profileId}`]: { displayName, unlockedAt: new Date().toISOString() },
          },
          { analytics },
        );
      } catch (error: any) {
        const statusCode = error?.status || error?.statusCode;
        if (statusCode === 409) {
          visitor
            .fireToast({
              title: "Already Unlocked",
              text: "You've already unlocked these accessories!",
            })
            .catch((toastError: any) =>
              errorHandler({
                error: toastError,
                functionName: "handleEmoteUnlockAttempt",
                message: "Error firing toast",
              }),
            );

          droppedAsset.updateDataObject({}, { analytics });
        } else {
          return errorHandler({
            error,
            functionName: "handleEmoteUnlockAttempt",
            message: "Error granting accessory",
            req,
            res,
          });
        }
      }
    }

    await droppedAsset.fetchDataObject();
    return res.json({
      unlockData: droppedAsset.dataObject,
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleEmoteUnlockAttempt",
      message: "Error attempting to unlock item",
      req,
      res,
    });
  }
};
