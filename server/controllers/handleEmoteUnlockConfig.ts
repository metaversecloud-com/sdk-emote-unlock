import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const handleEmoteUnlockConfig = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials;
    const { unlockType, selectedEmote, selectedAccessories, unlockCondition, itemDescription, selectedPack } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);

    // Validation based on unlock type
    if (unlockType === "emote") {
      if (!selectedEmote || !unlockCondition) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }
    } else if (unlockType === "accessory") {
      if (!selectedAccessories?.length || !unlockCondition) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one accessory",
        });
      }
    }

    // For emotes, upload preview image to S3
    let itemPreviewUrl = unlockType === "accessory" ? "/default-accessory-icon.svg" : "/default-emote-icon.svg";
    if (unlockType === "emote" && selectedEmote?.previewUrl) {
      const imageUrl = selectedEmote.previewUrl;
      try {
        const fileName = `${selectedEmote.name}.png`;

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());

        const bucketName = process.env.S3_BUCKET || "sdk-emunlock";
        const s3Credentials = { region: "us-east-1" };
        const client = new S3Client(s3Credentials);
        const putObjectCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          ContentType: "image/png",
          Body: buffer,
        });

        await client.send(putObjectCommand);

        itemPreviewUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${fileName}`;
      } catch (error) {
        console.error("Error uploading file:", error);
        itemPreviewUrl = imageUrl;
      }
    } else if (unlockType === "accessory" && selectedPack?.previewUrl) {
      itemPreviewUrl = selectedPack.previewUrl;
    }

    // Build question/answer fields based on question type
    const questionType = unlockCondition.type || "text";
    let questionFields: any = { questionType };

    if (questionType === "open_text") {
      // No answer validation needed — any response unlocks
    } else if (questionType === "text") {
      questionFields.password = unlockCondition.value.toString().trim().toLowerCase();
    } else {
      // multiple_choice or all_that_apply
      questionFields.options = unlockCondition.options.map((o: string) => o.trim());
      questionFields.correctAnswers = unlockCondition.correctAnswers;
    }

    // Build unlock data based on type
    let unlockData: any;
    if (unlockType === "emote") {
      unlockData = {
        unlockType: "emote",
        itemId: selectedEmote.id,
        itemName: selectedEmote.name,
        itemDescription: selectedEmote.description || itemDescription || "",
        itemPreviewUrl,
        ...questionFields,
        stats: {
          attempts: 0,
          successfulUnlocks: {},
        },
      };
    } else {
      unlockData = {
        unlockType: "accessory",
        accessoryIds: selectedAccessories.map((a: any) => a.id),
        accessoryNames: selectedAccessories.map((a: any) => a.name),
        accessoryPreviewUrls: selectedAccessories.map((a: any) => a.previewUrl || "/default-accessory-icon.svg"),
        itemName: selectedPack?.name || "Accessories",
        itemDescription: itemDescription || "",
        itemPreviewUrl,
        ...questionFields,
        stats: {
          attempts: 0,
          successfulUnlocks: {},
        },
      };
    }

    await droppedAsset.updateDataObject(unlockData, {
      analytics: [
        {
          analyticName: "new_configurations",
          uniqueKey: profileId,
        },
      ],
    });

    const itemType = unlockType === "accessory" ? "Accessory" : "Emote";
    return res.json({
      unlockData,
      success: true,
      message: `${itemType} unlock configuration saved successfully`,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleEmoteUnlockConfig",
      message: "Error saving unlock configuration",
      req,
      res,
    });
  }
};
