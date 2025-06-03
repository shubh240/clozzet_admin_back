import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";
import { createContent, getAllContent,updateContent, deleteContent, getContentById,statusContent } from "../controllers/contentController.js";

const router = express.Router();

router.post(
  "/add-content",
  isUserAuthenticated,
  createContent
); 

router.get("/list-content", getAllContent);

router.get("/show-content/:id", isUserAuthenticated, getContentById);

router.put(
  "/edit-content/:id",
  isUserAuthenticated,
  updateContent
); 

router.delete("/delete-content/:id", isUserAuthenticated, deleteContent);

router.patch("/status-content/:id", isUserAuthenticated, statusContent);

export default router;
