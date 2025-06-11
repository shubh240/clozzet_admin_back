import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Category } from "../models/category.model.js";
import { sendResponse } from "../common/index.js";


export const createCategory = async (req, res) => {
    try {
      const { name } = req.body;
      const createdBy = req.id;
      
      if (!name || name.trim() === "") {
        return sendResponse(res, 400, false, "Category name is required");
      }
  
      if (!req.files || !req.files["image"] || req.files["image"].length === 0) {
        return sendResponse(res, 400, false, "Category image is required");
      }
  
      const imagePath = req.files["image"][0].path;
  
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
  
      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" }; 
      }
  
      const categories = await Category.find(query)
        .sort({ createdAt: 1 })
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
    const updatedBy = req.id;

    if (!id) {
      return sendResponse(res, 400, false, "Category ID is required");
    }

    const category = await Category.findById(id);
    if (!category) {
      return sendResponse(res, 404, false, "Category not found");
    }

    let imageUrl = category.image;

    if (req.files && req.files["image"]) {
      const imagePath = req.files["image"][0].path;

      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/categories/images",
        resource_type: "image",
      });

      imageUrl = imageResult.secure_url;
      fs.unlinkSync(imagePath); 
      category.image = imageUrl;
    }

    if (name && name.trim() !== "") {
      category.name = name;
    }

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
      const deletedBy = req.id;
  
      if (!id) {
        return sendResponse(res, 400, false, "Category ID is required");
      }
  
      const category = await Category.findById(id);
      if (!category) {
        return sendResponse(res, 404, false, "Category not found");
      }
  
      category.isDeleted = true;
      category.deletedBy = deletedBy;
  
      await category.save();
  
      return sendResponse(res, 200, true, "Category deleted successfully", category);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};




