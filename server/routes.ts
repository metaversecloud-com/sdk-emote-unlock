import express from "express";
import {
  handleDropAsset,
  handleGetDroppedAsset,
  handleGetVisitor,
  handleRemoveDroppedAssetsByUniqueName,
  handleGetWorldDetails,
  handleGetEmoteUnlock,
  handleEmoteUnlockAttempt,
  handleEmoteUnlockConfig,
  handleGetAvailableEmotes,
  handleTriggerParticle
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();
const SERVER_START_DATE = new Date();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
    },
  });
});

//dropped Assets
router.post("/dropped-asset", handleDropAsset);
router.get("/dropped-asset", handleGetDroppedAsset);
router.post("/remove-dropped-assets", handleRemoveDroppedAssetsByUniqueName);

//visitor
router.get("/visitor", handleGetVisitor);

//world
router.get("/world", handleGetWorldDetails);

//emote unlock
router.get("/emote-unlock", handleGetEmoteUnlock);
router.post("/emote-unlock/attempt", handleEmoteUnlockAttempt);
router.post("/emote-unlock/config", handleEmoteUnlockConfig);
router.get("/available-emotes", handleGetAvailableEmotes);
router.post("/trigger-particle", handleTriggerParticle);

export default router;
