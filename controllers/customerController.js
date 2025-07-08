import mongoose from "mongoose";
import { sendResponse } from "../common/index.js";
import { Customer } from "../models/customer.model.js";
import { CustomerAddress } from "../models/customerAddres.model.js";

export const listCustomers = async (req, res) => {
  try {
    const {
      page,
      limit,
      search = '',
      startDate,
      endDate,
    } = req.body;

    // ✅ Safe defaults with optional check
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.max(parseInt(limit) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage = {};

    // 🔍 Search by name, email, or mobile
    if (search.trim() !== '') {
      const regex = new RegExp(search, 'i');
      matchStage.$or = [
        { fullName: regex },
        { email: regex },
        { mobileNo: !isNaN(search) ? Number(search) : undefined },
      ];
    }

    // 📅 Filter by date range
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: CustomerAddress.modelName,
          localField: "_id",
          foreignField: "customerId",
          as: "addresses",
          pipeline: [
            { $match: { is_deleted: false } },
            { $sort: { createdAt: -1 } },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ];

    const customers = await Customer.aggregate(pipeline);
    const total = await Customer.countDocuments(matchStage);

    return sendResponse(res, 200, true, "Customers fetched successfully", {
      customers,
      total,
      page: pageNumber,
      limit: limitNumber,
    });
  } catch (err) {
    console.error("Error in listCustomers:", err);
    return sendResponse(res, 500, false, "Something went wrong", {});
  }
};
