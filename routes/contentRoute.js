import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated , {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";
import { createContent, getAllContent,updateContent, deleteContent, getContentById,statusContent } from "../controllers/contentController.js";

const router = express.Router();

router.post(
  "/add-content",
  isSuperAdminAuthenticated,
  createContent
); 

router.get("/list-content", getAllContent);

router.get("/show-content/:id", isUserAuthenticated, getContentById);

router.put(
  "/edit-content/:id",
  isSuperAdminAuthenticated,
  updateContent
); 

router.delete("/delete-content/:id", isSuperAdminAuthenticated, deleteContent);

router.patch("/status-content/:id", isSuperAdminAuthenticated, statusContent);

export default router;
