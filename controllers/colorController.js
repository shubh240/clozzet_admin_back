import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Color } from "../models/color.model.js";
import { sendResponse } from "../common/index.js";


export const createColor = async (req, res) => {
    try {
      const { name } = req.body;
      const createdBy = req.id;
      
      // ✅ Validation: name is required
      if (!name || name.trim() === "") {
        return sendResponse(res, 400, false, "Color name is required");
      }
  
      // ✅ Validation: image file is required
      if (!req.files || !req.files["image"] || req.files["image"].length === 0) {
        return sendResponse(res, 400, false, "Color image is required");
      }
  
      const imagePath = req.files["image"][0].path;
  
      // Upload to Cloudinary
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/colors/images",
        resource_type: "image",
      });
  
      const imageUrl = imageResult.secure_url;
      fs.unlinkSync(imagePath); 
  
      const newColor = new Color({
        name,
        image: imageUrl,
        createdBy,
      });
  
      await newColor.save();
  
      return sendResponse(res, 201, true, "Color created successfully", newColor);
    } catch (error) {
      return sendResponse(res, 500, false, error.message);
    }
};

export const getColors = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const query = { isDeleted: false };

    // Apply search filter
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const options = {
      sort: { createdAt: -1 },
      populate: { path: "createdBy", select: "_id name email" },
      lean: true,
    };

    // If pagination is requested
    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [colors, total] = await Promise.all([
        Color.find(query)
          .sort(options.sort)
          .skip(skip)
          .limit(limitNum)
          .populate(options.populate)
          .lean(),
        Color.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return sendResponse(res, 200, true, "Colors list fetched successfully", {
        colors,
        pagination: {
          total,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        },
      });
    }

    // No pagination — return all but still return pagination metadata
    const [colors, total] = await Promise.all([
      Color.find(query).sort(options.sort).populate(options.populate).lean(),
      Color.countDocuments(query),
    ]);

    return sendResponse(res, 200, true, "Colors list fetched successfully", {
      colors,
      pagination: {
        total,
        totalPages: 1,
        currentPage: 1,
        limit: total,
      },
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};


export const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedBy = req.id;

    // ✅ Validate: Category ID is required
    if (!id) {
      return sendResponse(res, 400, false, "Color Id is required");
    }

    // ✅ Check if category exists
    const color = await Color.findById(id);
    if (!color) {
      return sendResponse(res, 404, false, "Color not found");
    }
    if(color.isDeleted ==true){
      return sendResponse(res, 404, false, "Color was deleted");
    }

    let imageUrl = color.image;

    // ✅ If a new image is uploaded
    if (req.files && req.files["image"]) {
      const imagePath = req.files["image"][0].path;

      // Upload image to Cloudinary
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/colors/images",
        resource_type: "image",
      });

      imageUrl = imageResult.secure_url;
      fs.unlinkSync(imagePath); 
      color.image = imageUrl;
    }

    // ✅ Update fields only if they are provided
    if (name && name.trim() !== "") {
      color.name = name;
    }

    color.updatedBy = updatedBy;

    await color.save();

    return sendResponse(res, 200, true, "Color updated successfully", color);
  } catch (error) {
    return sendResponse(res, 500, false,error.message);
  }
};
  
export const deleteColor = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBy = req.id;
  
      // Validate category ID
      if (!id) {
        return sendResponse(res, 400, false, "Color Id is required");
      }
  
      // Find the category by ID
      const color = await Color.findById(id);
      if (!color) {
        return sendResponse(res, 404, false, "Color not found");
      }
  
      // Soft delete by updating isDeleted and deletedBy fields
      color.isDeleted = true;
      color.deletedBy = deletedBy;
  
      await color.save();
  
      return sendResponse(res, 200, true, "Color deleted successfully", color);
    } catch (error) {
      return sendResponse(res, 500, false, error.message);
    }
};




