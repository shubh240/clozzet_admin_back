import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";
import { createSubcategory, deleteSubcategory, getSubcategories, updateSubcategory } from "../controllers/subCategoryController.js";

const router = express.Router();

// Upload Image and Video Middleware
router.post(
  "/add-sub-category",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  createSubcategory
); 

router.get("/list-sub-category", isUserAuthenticated, getSubcategories);

router.put(
  "/edit-sub-category/:id",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  updateSubcategory
); 

router.delete("/delete-sub-category/:id", isUserAuthenticated, deleteSubcategory);

export default router;
