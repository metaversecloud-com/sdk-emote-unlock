import { Credentials } from "../types/Credentials.js";
import { Ecosystem } from "./topiaInit.js";

interface CachedInventory {
  items: any[];
  timestamp: number;
}

// Cache duration: 6 hours in milliseconds
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// In-memory cache
let inventoryCache: CachedInventory | null = null;

/**
 * Get ecosystem inventory items with caching
 * - Fetches from cache if available and not expired
 * - Refreshes cache if expired or missing
 * - Can force refresh by passing forceRefresh: true
 */
export const getCachedInventoryItems = async ({
  credentials,
  forceRefresh = false,
}: {
  credentials: Credentials;
  forceRefresh?: boolean;
}): Promise<any[]> => {
  try {
    const now = Date.now();

    // Check if cache is valid and not expired
    const isCacheValid = inventoryCache !== null && !forceRefresh && now - inventoryCache.timestamp < CACHE_DURATION_MS;

    if (isCacheValid) {
      return inventoryCache!.items;
    }

    // Fetch fresh inventory items
    console.log("Fetching fresh inventory items from ecosystem");
    const ecosystem = Ecosystem.create({ credentials });
    await ecosystem.fetchInventoryItems();

    // Update cache
    inventoryCache = {
      items: (ecosystem.inventoryItems as any[]).map((item) => ({
        ...item,
        metadata: {
          ...(item.metadata || {}),
          sortOrder: typeof item.metadata?.sortOrder === "number" ? item.metadata.sortOrder : 0,
        },
      })).sort((a, b) => {
        const aOrder = a.metadata?.sortOrder ?? 0;
        const bOrder = b.metadata?.sortOrder ?? 0;
        return aOrder - bOrder;
      }),
      timestamp: now,
    };

    return inventoryCache.items;
  } catch (error) {
    // If fetch fails but we have stale cache, return it as fallback
    if (inventoryCache !== null) {
      console.warn("Failed to fetch fresh inventory, using stale cache", error);
      return inventoryCache.items;
    }

    throw error;
  }
};

/**
 * Clear the inventory cache (useful for testing or forced refresh)
 */
export const clearInventoryCache = (): void => {
  inventoryCache = null;
  console.log("Inventory cache cleared");
};

/**
 * Get cache status for debugging
 */
export const getInventoryCacheStatus = (): {
  isCached: boolean;
  age?: number;
  itemCount?: number;
} => {
  if (inventoryCache === null) {
    return { isCached: false };
  }

  return {
    isCached: true,
    age: Date.now() - inventoryCache.timestamp,
    itemCount: inventoryCache.items.length,
  };
};
