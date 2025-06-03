import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Content } from "../models/content.model.js";
import { sendResponse } from "../common/index.js";
import slugify from "slugify";

export const createContent = async (req, res) => {
  try {
    const { title, slug, description } = req.body;
    const createdBy = req.id;

    // ✅ Validation: name is required
    if (!title || title.trim() === "") {
      return sendResponse(res, 400, false, "Content title is required");
    }

    if (!slug || slug.trim() === "") {
      return sendResponse(res, 400, false, "Content slug is required");
    }

    if (!description) {
      return sendResponse(res, 400, false, "Content description is required");
    }

    const cleanedSlug = slugify(slug, { lower: true, strict: true });

    const existing  = await Content.findOne({
      slug: cleanedSlug,
    });
    if (existing) {
      return sendResponse(
        res,
        400,
        false,
        "Slug must be unique. This slug already exists."
      );
    }

    const content = new Content({
      title,
      slug : cleanedSlug,
      description,
      createdBy,
    });

    await content.save();

    return sendResponse(
      res,
      201,
      true,
      "Content created successfully",
      content
    );
  } catch (error) {
    console.log(error.message)
    return sendResponse(res, 500, false,error.message);
  }
};

export const getAllContent = async (req, res) => {
  try {
    const query = { is_deleted: false };

    const contents = await Content.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "_id name email")
      .lean();

    return sendResponse(
      res,
      200,
      true,
      "Content list fetched successfully",
      contents
    );
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(res, 400, false, "Content ID is required");
    }

    const content = await Content.findById(id)
      .populate("createdBy", "_id name email")
      .lean();

    if (!content || content.is_deleted) {
      return sendResponse(res, 404, false, "Content not found");
    }

    return sendResponse(res, 200, true, "Content fetched successfully", content);
  } catch (error) {
    return sendResponse(res, 500, false,  error.message);
  }
};

export const updateContent = async (req, res) => {
  try {
    const { title, slug, description, status } = req.body;
    const { id } = req.params;
    const updatedBy = req.id;

    const content = await Content.findOne({ _id: id, is_deleted: false });
    if (!content) {
      return sendResponse(res, 404, false, "Content not found");
    }

    if (slug && slug.trim() !== "") {
      const cleanedSlug = slugify(slug, { lower: true, strict: true });

      const duplicateSlug = await Content.findOne({
        _id: { $ne: id },
        slug: cleanedSlug,
        is_deleted: false,
      });

      if (duplicateSlug) {
        return sendResponse(res, 400, false, "Slug already exists");
      }

      content.slug = cleanedSlug;
    }

    content.updatedBy = updatedBy;
    if (title) content.title = title;
    if (description) content.description = description;
    if (status) content.status = status;

    await content.save();

    return sendResponse(res, 200, true, "Content updated successfully", content);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteContent = async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, is_deleted: false });
    if (!content) return res.status(404).json({ message: "Content not found" });

    content.is_deleted = true;
    content.deletedBy = req.adminId;
    await content.save();

    res.status(200).json({ message: "Content deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const statusContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return sendResponse(res, 400, false, "Content ID is required");
    }

    const content = await Content.findById(id);

    if (!content || content.is_deleted) {
      return sendResponse(res, 404, false, "Content not found");
    }

    // Toggle status
    content.status = !content.status;

    await content.save();

    return sendResponse(
      res,
      200,
      true,
      `Content status updated to ${content.status ? "active" : "inactive"}`,
      { status: content.status }
    );
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
