import { Request, Response } from "express";
import { InventoryItemInterface } from "@rtsdk/topia";
import { errorHandler, getCredentials, getCachedInventoryItems, Visitor } from "../utils/index.js";

interface UnlockableInventoryItem extends InventoryItemInterface {
  metadata?: {
    packId?: string;
    category?: string;
    accessory?: string;
    [key: string]: any;
  };
}

interface Expression {
  id: string;
  name: string;
  expressionImage?: string;
  type: string;
}

export const handleGetUnlockables = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { visitorId, urlSlug } = credentials;
    const forceRefresh = req.query.forceRefreshInventory === "true";

    // Fetch emotes and inventory items in parallel using cache
    const [visitor, allInventoryItems] = await Promise.all([
      Visitor.get(visitorId, urlSlug, { credentials }),
      getCachedInventoryItems({ credentials, forceRefresh }) as Promise<UnlockableInventoryItem[]>,
    ]);

    const availableExpressions = (await visitor.getExpressions({ getUnlockablesOnly: true })) as Expression[];

    // Map emotes
    const emotes = availableExpressions.map((expression) => ({
      id: expression.id,
      name: expression.name,
      type: expression.type,
      previewUrl: expression.expressionImage || `/default-emote-icon.svg`,
    }));

    // Get packs (AVATAR_ACCESSORY_PACK)
    const packItems = allInventoryItems?.filter((item) => item.type === "AVATAR_ACCESSORY_PACK") || [];

    // Get individual accessories (ACCESSORY)
    const accessories = allInventoryItems?.filter((item) => item.type === "ACCESSORY") || [];

    // Build packs with their individual accessories grouped by packId
    const packs = packItems.map((pack) => {
      const packId = pack.metadata?.packId;
      const packAccessories = accessories
        .filter((acc) => acc.metadata?.packId === packId)
        .map((acc) => ({
          id: acc.id,
          name: acc.name,
          category: acc.metadata?.category || "",
          previewUrl: acc.image_path || "/default-accessory-icon.svg",
        }));

      return {
        id: pack.id,
        name: pack.name,
        description: pack.description || "",
        previewUrl: pack.image_path || "/default-accessory-icon.svg",
        packId,
        accessories: packAccessories,
      };
    });

    return res.json({
      emotes,
      packs,
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetUnlockables",
      message: "Error getting unlockables",
      req,
      res,
    });
  }
};
