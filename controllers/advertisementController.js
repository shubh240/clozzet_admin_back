import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Category } from "../models/category.model.js";
import { Advertisement } from "../models/advertisement.model.js";
import { sendResponse } from "../common/index.js";
import slugify from "slugify";

export const createAdvertisement = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const createdBy = req.id;

    // ✅ Validation: name is required
    if (!name || name.trim() === "") {
      return sendResponse(res, 400, false, "Advertisement name is required");
    }

    if (!slug || slug.trim() === "") {
      return sendResponse(res, 400, false, "Advertisement slug is required");
    }

    // ✅ Validation: image file is required
    if (!req.files || !req.files["image"] || req.files["image"].length === 0) {
      return sendResponse(res, 400, false, "Advertisement image is required");
    }

    const cleanedSlug = slugify(slug, { lower: true, strict: true });

    const existingAdvertisement = await Advertisement.findOne({
      slug: cleanedSlug,
      isDeleted: false,
    });
    if (existingAdvertisement) {
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
      folder: "uploads/advertisement/images",
      resource_type: "image",
    });

    const imageUrl = imageResult.secure_url;
    fs.unlinkSync(imagePath);

    const newAdvertisement = new Advertisement({
      name,
      slug : cleanedSlug,
      image: imageUrl,
      createdBy,
    });

    await newAdvertisement.save();

    return sendResponse(
      res,
      201,
      true,
      "Advertisement created successfully",
      newAdvertisement
    );
  } catch (error) {
    return sendResponse(res, 500, false,error.message);
  }
};

export const getAdvertisement = async (req, res) => {
  try {
    const { search } = req.query;

    const query = { isDeleted: false };

    // Add search condition if query param exists
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const advertisements = await Advertisement.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "_id name email")
      .lean();

    return sendResponse(
      res,
      200,
      true,
      "Advertisement list fetched successfully",
      advertisements
    );
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    const updatedBy = req.id;

    const advertisement = await Advertisement.findOne({ _id: id, isDeleted: false });

    if (!advertisement) {
      return sendResponse(res, 404, false, "Advertisement not found");
    }

    // Optional name update
    if (name && name.trim() !== "") {
      advertisement.name = name.trim();
    }

    // Optional slug update
    if (slug && slug.trim() !== "") {
      const cleanedSlug = slugify(slug, { lower: true, strict: true });

      const duplicateSlug = await Advertisement.findOne({
        _id: { $ne: id },
        slug: cleanedSlug,
        isDeleted: false,
      });

      if (duplicateSlug) {
        return sendResponse(res, 400, false, "Slug already exists");
      }

      advertisement.slug = cleanedSlug;
    }

    // Optional image update
    if (req.files?.image?.length) {
      const imagePath = req.files.image[0].path;

      // Upload new image to Cloudinary
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/advertisement/images",
        resource_type: "image",
      });

      fs.unlinkSync(imagePath);

      advertisement.image = imageResult.secure_url;
    }

    advertisement.updatedBy = updatedBy;

    await advertisement.save();

    return sendResponse(res, 200, true, "Advertisement updated successfully", advertisement);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.id;

    if (!id) {
      return sendResponse(res, 400, false, "Advertisement ID is required");
    }

    const advertisement = await Advertisement.findById(id);
    if (!advertisement || advertisement.isDeleted) {
      return sendResponse(res, 404, false, "Advertisement not found");
    }

    // Soft delete: mark as deleted and set deletedBy
    advertisement.isDeleted = true;
    advertisement.deletedBy = deletedBy;

    await advertisement.save();

    return sendResponse(
      res,
      200,
      true,
      "Advertisement deleted successfully",
      advertisement
    );
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const showAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(res, 400, false, "Advertisement ID is required");
    }

    const advertisement = await Advertisement.findById(id)
      .populate("createdBy", "_id name email")
      .lean();

    if (!advertisement || advertisement.isDeleted) {
      return sendResponse(res, 404, false, "Advertisement not found");
    }

    return sendResponse(res, 200, true, "Advertisement fetched successfully", advertisement);
  } catch (error) {
    return sendResponse(res, 500, false,  error.message);
  }
};

export const statusAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return sendResponse(res, 400, false, "Advertisement ID is required");
    }

    const advertisement = await Advertisement.findById(id);

    if (!advertisement || advertisement.isDeleted) {
      return sendResponse(res, 404, false, "Advertisement not found");
    }

    // Toggle status
    advertisement.status = !advertisement.status;

    await advertisement.save();

    return sendResponse(
      res,
      200,
      true,
      `Advertisement status updated to ${advertisement.status ? "active" : "inactive"}`,
      { status: advertisement.status }
    );
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
