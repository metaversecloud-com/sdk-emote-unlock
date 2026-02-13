import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";
import { errorHandler } from "../errorHandler.js";

/**
 * Initialize a dropped asset's data object with a count value of 0 if it doesn't exist
 */
export const initializeDroppedAssetDataObject = async (droppedAsset: IDroppedAsset) => {
  try {
    await droppedAsset.fetchDataObject();

    const dataObject = droppedAsset?.dataObject as any;
    const hasExistingConfig = dataObject?.emoteId || dataObject?.itemId || dataObject?.accessoryIds || dataObject?.unlockType;
    if (!hasExistingConfig) {
      const unlockData = {
        emoteId: "",
        emoteName: "",
        emotePreviewUrl: "",
        emoteDescription: "",
        password: "", //only sent to admin
        stats: {
          attempts: 0,
          successfulUnlocks: {},
        },
      };

      // Generate a timestamp-based lockId, but use a simple timestamp format to avoid timezone issues
      // The Math.round makes sure we get a consistent minute-based timestamp value
      const timestamp = Math.round(Date.now() / 60000);
      const lockId = `${droppedAsset.id}-${timestamp}`;

      await droppedAsset
        .setDataObject(unlockData, { lock: { lockId } })
        .catch(() => console.warn("Unable to acquire lock, another process may be updating the data object"));
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeDroppedAssetDataObject",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
