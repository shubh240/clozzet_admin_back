import express from "express";
import {
  sendNotification
} from "../controllers/notificationController.js";
import isUserAuthenticated , {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/",isSuperAdminAuthenticated,  upload.fields([
    { name: "image", maxCount: 1 }
  ]), sendNotification);


export default router;
