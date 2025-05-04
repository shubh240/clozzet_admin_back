import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categoryController.js";

const router = express.Router();

// Upload Image and Video Middleware
router.post(
  "/add-category",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  createCategory
); 

router.get("/list-category", isUserAuthenticated, getCategories);

router.put(
  "/edit-category/:id",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  updateCategory
); 

router.delete("/delete-category/:id", isUserAuthenticated, deleteCategory);

export default router;
