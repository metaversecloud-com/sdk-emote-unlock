import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";
import fs from "fs";

export const handleEmoteUnlockConfig = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { selectedEmote, unlockCondition, emoteDescription } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);

    if (!selectedEmote || !unlockCondition) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let emotePreviewUrl = `/default-emote-icon.svg`;
    if (req.hostname !== "localhost" && selectedEmote.previewUrl) {
      const fileName = `${selectedEmote.name}.png`;
      https.get(selectedEmote.previewUrl, (res: any) => {
        res.pipe(fs.createWriteStream(""));
      });

      const bucketName = process.env.S3_BUCKET || "sdk-emunlock";
      const credentials = { region: "us-east-1" };
      const client = new S3Client(credentials);
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ContentType: "image/png",
      });

      await client.send(putObjectCommand);
      emotePreviewUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${fileName}`;
    }

    const unlockData = {
      emoteId: selectedEmote.id,
      emoteName: selectedEmote.name,
      emoteDescription: selectedEmote.description || emoteDescription,
      emotePreviewUrl,
      password: unlockCondition.value.toString().trim().toLowerCase(),
      stats: {
        attempts: 0,
        successfulUnlocks: {},
      },
    };

    await droppedAsset.updateDataObject(unlockData, {
      analytics: [
        {
          analyticName: "new_configurations",
          uniqueKey: profileId,
        },
      ],
    });

    return res.json({
      unlockData,
      success: true,
      message: "Emote unlock configuration saved successfully",
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleEmoteUnlockConfig",
      message: "Error saving emote unlock configuration",
      req,
      res,
    });
  }
};
