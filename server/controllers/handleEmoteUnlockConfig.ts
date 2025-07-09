import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

    const imageUrl = selectedEmote.previewUrl;
    let emotePreviewUrl = `/default-emote-icon.svg`;
    if (imageUrl) {
      try {
        const fileName = `${selectedEmote.name}.png`;

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());

        const bucketName = process.env.S3_BUCKET || "sdk-emunlock";
        const credentials = { region: "us-east-1" };
        const client = new S3Client(credentials);
        const putObjectCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          ContentType: "image/png",
          Body: buffer,
        });

        await client.send(putObjectCommand);

        emotePreviewUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${fileName}`;
      } catch (error) {
        console.error("Error uploading file:", error);
      }
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
