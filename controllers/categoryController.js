import { StoreInfo } from "../models/sellerStoreInfo.model.js"; 
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import cloudinary from "cloudinary";
import fs from "fs";
import { Category } from "../models/category.model.js";


export const createCategory = async (req, res) => {
    try {
      const { name } = req.body;
      const createdBy = req._id;
  
      // ✅ Validation: name is required
      if (!name || name.trim() === "") {
        return sendResponse(res, 400, false, "Category name is required");
      }
  
      // ✅ Validation: image file is required
      if (!req.files || !req.files["image"] || req.files["image"].length === 0) {
        return sendResponse(res, 400, false, "Category image is required");
      }
  
      const imagePath = req.files["image"][0].path;
  
      // Upload to Cloudinary
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/categories/images",
        resource_type: "image",
      });
  
      const imageUrl = imageResult.secure_url;
      fs.unlinkSync(imagePath); 
  
      const newCategory = new Category({
        name,
        image: imageUrl,
        createdBy,
      });
  
      await newCategory.save();
  
      return sendResponse(res, 201, true, "Category created successfully", newCategory);
    } catch (error) {
      return sendResponse(res, 500, false, "Server Error", { error: error.message });
    }
};

export const getCategories = async (req, res) => {
    try {
      const { search } = req.query;
  
      const query = { isDeleted: false };
  
      // Add search condition if query param exists
      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" }; 
      }
  
      const categories = await Category.find(query)
        .sort({ createdAt: -1 })
        .populate("createdBy", "_id name email")
        .lean();
  
      return sendResponse(res, 200, true, "Category list fetched successfully", categories);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};  

export const updateCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const updatedBy = req._id;
  
      // ✅ Validation: category ID is required
      if (!id) {
        return sendResponse(res, 400, false, "Category ID is required");
      }
  
      // ✅ Validation: name is required
      if (!name || name.trim() === "") {
        return sendResponse(res, 400, false, "Category name is required");
      }
  
      // Check if category exists
      const category = await Category.findById(id);
      if (!category) {
        return sendResponse(res, 404, false, "Category not found");
      }
  
      let imageUrl = category.image;
  
      // If new image is uploaded
      if (req.files && req.files["image"]) {
        const imagePath = req.files["image"][0].path;
  
        // Upload image to Cloudinary
        const imageResult = await cloudinary.uploader.upload(imagePath, {
          folder: "uploads/categories/images",
          resource_type: "image",
        });
  
        imageUrl = imageResult.secure_url;
        fs.unlinkSync(imagePath); // Remove the local file after upload
      }
  
      // Update the category
      category.name = name;
      category.image = imageUrl;
      category.updatedBy = updatedBy;
  
      await category.save();
  
      return sendResponse(res, 200, true, "Category updated successfully", category);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};
  
export const deleteCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBy = req._id;
  
      // Validate category ID
      if (!id) {
        return sendResponse(res, 400, false, "Category ID is required");
      }
  
      // Find the category by ID
      const category = await Category.findById(id);
      if (!category) {
        return sendResponse(res, 404, false, "Category not found");
      }
  
      // Soft delete by updating isDeleted and deletedBy fields
      category.isDeleted = true;
      category.deletedBy = deletedBy;
  
      await category.save();
  
      return sendResponse(res, 200, true, "Category deleted successfully", category);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};




