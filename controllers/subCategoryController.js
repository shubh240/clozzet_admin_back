import { StoreInfo } from "../models/sellerStoreInfo.model.js"; 
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import cloudinary from "cloudinary";
import fs from "fs";
import { Category } from "../models/category.model.js";
import { Subcategory } from "../models/subCategory.js";


export const createSubcategory = async (req, res) => {
    try {
      const { name, category, image } = req.body;
      const createdBy = req._id;
  
      if (!name || !category) {
        return sendResponse(res, 400, false, "Subcategory name and category are required");
      }
  
      const newSubcategory = new Subcategory({
        name,
        category,
        image,
        createdBy,
      });
  
      await newSubcategory.save();
  
      return sendResponse(res, 201, true, "Subcategory created successfully", newSubcategory);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};
  
export const getSubcategories = async (req, res) => {
    try {
      const { category, search } = req.query;
  
      let query = { isDeleted: false };
  
      // Filter by category if provided
      if (category) {
        query.category = category;
      }
  
      // Filter by search if provided (search by name)
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }
  
      const subcategories = await Subcategory.find(query)
        .populate("category", "_id name") 
        .populate("createdBy", "_id name email") 
        .populate("updatedBy", "_id name email") 
        .exec();
  
      return sendResponse(res, 200, true, "Subcategories fetched successfully", subcategories);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};
    
export const updateSubcategory = async (req, res) => {
    try {
      const { id } = req.params; 
      const { name, category } = req.body;
      const updatedBy = req._id; 
  
      // Validate required fields
      if (!name || !category) {
        return sendResponse(res, 400, false, "Subcategory name and category are required");
      }
  
      const subcategory = await Subcategory.findById(id);
      if (!subcategory) {
        return sendResponse(res, 404, false, "Subcategory not found");
      }
  
      let imageUrl = subcategory.image; // Keep old image by default if no new image is provided
  
      if (req.files && req.files["image"]) {
        const imagePath = req.files["image"][0].path;
        const imageResult = await cloudinary.uploader.upload(imagePath, {
          folder: "uploads/subcategories/images",
          resource_type: "image",
        });
  
        imageUrl = imageResult.secure_url; 
        fs.unlinkSync(imagePath); 
      }
  
      subcategory.name = name;
      subcategory.category = category;
      subcategory.image = imageUrl;
      subcategory.updatedBy = updatedBy;
  
      await subcategory.save();
  
      return sendResponse(res, 200, true, "Subcategory updated successfully", subcategory);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};
  
  
export const deleteSubcategory = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBy = req._id; 
  
      const subcategory = await Subcategory.findById(id);
      if (!subcategory) {
        return sendResponse(res, 404, false, "Subcategory not found");
      }
  
      if (subcategory.isDeleted) {
        return sendResponse(res, 400, false, "Subcategory is already deleted");
      }
  
      subcategory.isDeleted = true;
      subcategory.deletedBy = deletedBy;
  
      await subcategory.save();
  
      return sendResponse(res, 200, true, "Subcategory deleted successfully", subcategory);
    } catch (error) {
      return sendResponse(res, 500, false, "Server error", { error: error.message });
    }
};




