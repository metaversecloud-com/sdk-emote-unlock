import { Credentials } from "../../types/index.js";
import { getCachedInventoryItems } from "../inventoryCache.js";

export interface BadgeOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const getBadges = async (credentials: Credentials, forceRefresh = false): Promise<BadgeOption[]> => {
  const inventoryItems = await getCachedInventoryItems({ credentials, forceRefresh });

  // `getCachedInventoryItems` already strips INACTIVE entries, so we just
  // need type + name here.
  return (inventoryItems || [])
    .filter((item: any) => item?.name && item.type === "BADGE")
    .sort((a: any, b: any) => (a.metadata?.sortOrder ?? Infinity) - (b.metadata?.sortOrder ?? Infinity))
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      icon: item.image_path || "/default-badge-icon.svg",
      description: item.description || "",
    }));
};
