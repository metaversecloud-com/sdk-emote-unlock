import { DroppedAsset } from "@rtsdk/topia";

export interface IDroppedAsset extends DroppedAsset {
  dataObject?: {
    emoteId: string;
    emoteName: string;
    emotePreviewUrl: string;
    emoteDescription: string;
    password: string;
    stats: {
      attempts: number;
      successfulUnlocks: number;
      unlockUsers: [];
    };
  };
}
