import { DroppedAsset } from "@rtsdk/topia";

export interface IDroppedAsset extends DroppedAsset {
  dataObject: {
    emoteId: string;
    emoteName: string;
    emotePreviewUrl: string;
    emoteDescription: string;
    password?: string;
    unlockType?: string;
    itemId?: string;
    itemName?: string;
    itemPreviewUrl?: string;
    itemDescription?: string;
    accessoryIds?: string[];
    packId?: string;
    correctAnswers?: string[] | number[];
    stats: {
      attempts: number;
      successfulUnlocks: { [profileId: string]: { unlockedAt: string; displayName?: string } };
    };
  };
}
