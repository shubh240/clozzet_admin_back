import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAuth",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAuth",
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAuth",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Content = mongoose.model("Content", contentSchema);
