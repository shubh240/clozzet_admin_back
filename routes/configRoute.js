import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated , {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";
import { createConfig, deleteConfig, getConfig, showConfig, statusConfig, updateConfig } from "../controllers/configController.js";

const router = express.Router();

router.post(
  "/add-config",
  isSuperAdminAuthenticated,
  createConfig
); 

router.get("/list-config", getConfig);

router.put(
  "/edit-config/:id",
  isSuperAdminAuthenticated,
  updateConfig
); 

// router.delete("/delete-config/:id", isUserAuthenticated, deleteConfig);

router.get("/show-config/:id", isUserAuthenticated, showConfig);

router.patch("/status-config/:id", isSuperAdminAuthenticated, statusConfig);

export default router;
