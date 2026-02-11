import { Request, Response } from "express";
import { errorHandler, getCredentials, Ecosystem } from "../utils/index.js";

interface InventoryItemType {
  id: string;
  name: string;
  type: string;
  description?: string;
  image_path?: string;
  metadata?: {
    packId?: string;
    category?: string;
    accessory?: string;
    [key: string]: any;
  };
}

export const handleGetAvailableAccessories = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
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

    const allInventoryItems = ecosystem.inventoryItems as InventoryItemType[];

    // Get packs (AVATAR_ACCESSORY_PACK)
    const packs = allInventoryItems?.filter((item) => item.type === "AVATAR_ACCESSORY_PACK") || [];

    // Get individual accessories (ACCESSORY)
    const accessories = allInventoryItems?.filter((item) => item.type === "ACCESSORY") || [];

    // DEBUG: Log each pack
    packs.forEach((pack) => {
      console.log("=== PACK ===", JSON.stringify(pack, null, 2));
    });

    // DEBUG: Log each individual accessory
    accessories.forEach((acc) => {
      console.log("=== ACCESSORY ===", JSON.stringify(acc, null, 2));
    });

    // Build packs with their individual accessories grouped by packId
    const packsWithAccessories = packs.map((pack) => {
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
      packs: packsWithAccessories,
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetAvailableAccessories",
      message: "Error getting available accessories",
      req,
      res,
    });
  }
};
