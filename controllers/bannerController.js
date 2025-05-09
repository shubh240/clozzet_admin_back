import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Category } from "../models/category.model.js";
import { Banner } from "../models/banner.model.js";
import { sendResponse } from "../common/index.js";
import slugify from "slugify";

export const createBanner = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const createdBy = req.id;

    // ✅ Validation: name is required
    if (!name || name.trim() === "") {
      return sendResponse(res, 400, false, "Banner name is required");
    }

    if (!slug || slug.trim() === "") {
      return sendResponse(res, 400, false, "Banner slug is required");
    }

    // ✅ Validation: image file is required
    if (!req.files || !req.files["image"] || req.files["image"].length === 0) {
      return sendResponse(res, 400, false, "Banner image is required");
    }

    const cleanedSlug = slugify(slug, { lower: true, strict: true });

    const existingBanner = await Banner.findOne({
      slug: cleanedSlug,
      isDeleted: false,
    });
    if (existingBanner) {
      return sendResponse(
        res,
        400,
        false,
        "Slug must be unique. This slug already exists."
      );
    }

    const imagePath = req.files["image"][0].path;

    // Upload to Cloudinary
    const imageResult = await cloudinary.uploader.upload(imagePath, {
      folder: "uploads/banner/images",
      resource_type: "image",
    });

    const imageUrl = imageResult.secure_url;
    fs.unlinkSync(imagePath);

    const newBanner = new Banner({
      name,
      slug : cleanedSlug,
      image: imageUrl,
      createdBy,
    });

    await newBanner.save();

    return sendResponse(
      res,
      201,
      true,
      "Banner created successfully",
      newBanner
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server Error", {
      error: error.message,
    });
  }
};

export const getBanner = async (req, res) => {
  try {
    const { search } = req.query;

    const query = { isDeleted: false };

    // Add search condition if query param exists
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "_id name email")
      .lean();

    return sendResponse(
      res,
      200,
      true,
      "Banner list fetched successfully",
      banners
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    const updatedBy = req.id;

    const banner = await Banner.findOne({ _id: id, isDeleted: false });

    if (!banner) {
      return sendResponse(res, 404, false, "Banner not found");
    }

    // Optional name update
    if (name && name.trim() !== "") {
      banner.name = name.trim();
    }

    // Optional slug update
    if (slug && slug.trim() !== "") {
      const cleanedSlug = slugify(slug, { lower: true, strict: true });

      const duplicateSlug = await Banner.findOne({
        _id: { $ne: id },
        slug: cleanedSlug,
        isDeleted: false,
      });

      if (duplicateSlug) {
        return sendResponse(res, 400, false, "Slug already exists");
      }

      banner.slug = cleanedSlug;
    }

    // Optional image update
    if (req.files?.image?.length) {
      const imagePath = req.files.image[0].path;

      // Upload new image to Cloudinary
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/banner/images",
        resource_type: "image",
      });

      fs.unlinkSync(imagePath);

      banner.image = imageResult.secure_url;
    }

    banner.updatedBy = updatedBy;

    await banner.save();

    return sendResponse(res, 200, true, "Banner updated successfully", banner);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.id;

    // Validate banner ID
    if (!id) {
      return sendResponse(res, 400, false, "Banner ID is required");
    }

    // Find the banner by ID
    const banner = await Banner.findById(id);
    if (!banner || banner.isDeleted) {
      return sendResponse(res, 404, false, "Banner not found");
    }

    // Soft delete: mark as deleted and set deletedBy
    banner.isDeleted = true;
    banner.deletedBy = deletedBy;

    await banner.save();

    return sendResponse(
      res,
      200,
      true,
      "Banner deleted successfully",
      banner
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const showBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate banner ID
    if (!id) {
      return sendResponse(res, 400, false, "Banner ID is required");
    }

    // Find the banner by ID
    const banner = await Banner.findById(id)
      .populate("createdBy", "_id name email")
      .lean();

    if (!banner || banner.isDeleted) {
      return sendResponse(res, 404, false, "Banner not found");
    }

    return sendResponse(res, 200, true, "Banner fetched successfully", banner);
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};

export const statusBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return sendResponse(res, 400, false, "Banner ID is required");
    }

    const banner = await Banner.findById(id);

    if (!banner || banner.isDeleted) {
      return sendResponse(res, 404, false, "Banner not found");
    }

    // Toggle status
    banner.status = !banner.status;

    await banner.save();

    return sendResponse(
      res,
      200,
      true,
      `Banner status updated to ${banner.status ? "active" : "inactive"}`,
      { status: banner.status }
    );
  } catch (error) {
    return sendResponse(res, 500, false, "Server error", {
      error: error.message,
    });
  }
};
