import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Category } from "../models/category.model.js";
import { Config } from "../models/config.model.js";
import { sendResponse } from "../common/index.js";
import slugify from "slugify";

export const createConfig = async (req, res) => {
  try {
    const { name, value } = req.body;
    const createdBy = req.id;

    if (!name || name.trim() === "") {
      return sendResponse(res, 400, false, "Config name is required");
    }

    if (!value || value.trim() === "") {
      return sendResponse(res, 400, false, "Config value is required");
    }

    const cleanedSlug = slugify(name, { lower: true, strict: true });

    const existingConfig = await Config.findOne({
      name: cleanedSlug,
      isDeleted: false,
    });
    if (existingConfig) {
      return sendResponse(
        res,
        400,
        false,
        "Name must be unique. This name already exists."
      );
    }

    const newConfig = new Config({
      name : cleanedSlug,
      value : value,
      createdBy,
    });

    await newConfig.save();

    return sendResponse(
      res,
      201,
      true,
      "Config created successfully",
      newConfig
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server Error", {
      error: error.message,
    });
  }
};

export const getConfig = async (req, res) => {
  try {
    const { search } = req.query;

    const query = { isDeleted: false };

    // Add search condition if query param exists
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const configs = await Config.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "_id name email")
      .lean();

    return sendResponse(
      res,
      200,
      true,
      "Config list fetched successfully",
      configs
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value } = req.body;
    const updatedBy = req.id;

    const config = await Config.findOne({ _id: id, isDeleted: false });

    if (!config) {
      return sendResponse(res, 404, false, "Config not found");
    }

    // Optional name update with slug generation and uniqueness check
    if (name && name.trim() !== "") {
      const cleanedName = slugify(name.trim(), { lower: true, strict: true });

      const duplicateName = await Config.findOne({
        _id: { $ne: id },
        name: cleanedName,
        isDeleted: false,
      });

      if (duplicateName) {
        return sendResponse(res, 400, false, "Name must be unique");
      }

      config.name = cleanedName;
    }

    // Optional value update
    if (value && value.trim() !== "") {
      config.value = value.trim();
    }

    config.updatedBy = updatedBy;

    await config.save();

    return sendResponse(res, 200, true, "Config updated successfully", config);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};


export const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.id;

    // Validate config ID
    if (!id) {
      return sendResponse(res, 400, false, "Config ID is required");
    }

    // Find the config by ID
    const config = await Config.findById(id);
    if (!config || config.isDeleted) {
      return sendResponse(res, 404, false, "Config not found");
    }

    // Soft delete: mark as deleted and set deletedBy
    config.isDeleted = true;
    config.deletedBy = deletedBy;

    await config.save();

    return sendResponse(
      res,
      200,
      true,
      "Config deleted successfully",
      config
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const showConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate config ID
    if (!id) {
      return sendResponse(res, 400, false, "Config ID is required");
    }

    // Find the config by ID
    const config = await Config.findById(id)
      .populate("createdBy", "_id name email")
      .lean();

    if (!config || config.isDeleted) {
      return sendResponse(res, 404, false, "Config not found");
    }

    return sendResponse(res, 200, true, "Config fetched successfully", config);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const statusConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return sendResponse(res, 400, false, "Config ID is required");
    }

    const config = await Config.findById(id);

    if (!config || config.isDeleted) {
      return sendResponse(res, 404, false, "Config not found");
    }

    // Toggle status
    config.status = !config.status;

    await config.save();

    return sendResponse(
      res,
      200,
      true,
      `Config status updated to ${config.status ? "active" : "inactive"}`,
      { status: config.status }
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};
