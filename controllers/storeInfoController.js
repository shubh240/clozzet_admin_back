import { StoreInfo } from "../models/sellerStoreInfo.model.js"; 
import { SellerUserAuth } from "../models/sellerUserInfo.model.js"; 
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import { sendResponse } from "../common/index.js"; 

export const addStore = async (req, res) => {
  try {
    const adminId = req.id;
    console.log(`adminId: ${adminId}`);

    const {
      firstName,
      lastName,
      mobileNo,
      email,
      password,
      confirmPassword,
      storeName,
      storeAddress,
      limitTime,
      position,
      zone,
      city,
      state,
      pincode,
      address_url,
    } = req.body;

    if (
      !firstName || !lastName || !mobileNo || !email || !password || !confirmPassword ||
      !storeName || !storeAddress || !city || !state || !pincode
    ) {
      return sendResponse(res, 400, false, "All required fields (seller + store) must be filled.");
    }

    if (password !== confirmPassword) {
      return sendResponse(res, 400, false, "Password and confirm password should be the same.");
    }

    const existingUser = await SellerUserAuth.findOne({
      "userInfo.mobileNo": mobileNo,
    });
    if (existingUser) {
      return sendResponse(res, 400, false, "Mobile number already registered.");
    }

    const gotStore = await StoreInfo.findOne({ storeName });
    if (gotStore) {
      return sendResponse(res, 400, false, "Store with this name already exists.");
    }

    let parsedPosition = {};
    let parsedLimitTime = {};

    try {
      parsedPosition = JSON.parse(position);
    } catch (e) {
      return sendResponse(res, 400, false, "Invalid position JSON format.");
    }

    try {
      parsedLimitTime = JSON.parse(limitTime);
    } catch (e) {
      return sendResponse(res, 400, false, "Invalid limitTime JSON format.");
    }

    let logoUrl = "";
    let coverPhotoUrl = "";

    if (req.files["logo"]) {
      const imagePath = req.files["logo"][0].path;
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/stores/logos",
        resource_type: "image",
      });
      logoUrl = imageResult.secure_url;
      fs.unlinkSync(imagePath);
    }

    if (req.files["coverPhoto"]) {
      const imagePath = req.files["coverPhoto"][0].path;
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/stores/coverPhotos",
        resource_type: "image",
      });
      coverPhotoUrl = imageResult.secure_url;
      fs.unlinkSync(imagePath);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSeller = new SellerUserAuth({
      userInfo: { firstName, lastName, mobileNo },
      userAuth: { email, password: hashedPassword },
      adminId,
    });

    await newSeller.save();

    const newStore = new StoreInfo({
      storeName,
      storeAddress,
      city,
      state,
      pincode,
      address_url,
      coverPhotoUrl,
      logoUrl,
      adminId,
      sellerAuthId: newSeller._id,
      position: {
        lat: parseFloat(parsedPosition.lat),
        lng: parseFloat(parsedPosition.lng),
      },
      limitTime: {
        minimum: parsedLimitTime.minimum,
        maximum: parsedLimitTime.maximum,
        selectTime: parsedLimitTime.selectTime,
      },
      zone,
    });

    const savedStore = await newStore.save();

    return sendResponse(res, 201, true, "Store created successfully", {
      store: savedStore,
      seller: newSeller,
    });

  } catch (error) {
    console.error("Error creating store:", error);
    return sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};

export const updateStore = async (req, res) => {
  try {
    const { id: storeId } = req.params;

    const {
      storeName,
      storeAddress,
      latitude,
      longitude,
      zone,
      mapAddress,
      limitTime,
      position,
      adminId,
      is_deleted,
      city,
      state,
      pincode,
      address_url,
      firstName,
      lastName,
    } = req.body;

    // Find the store
    const store = await StoreInfo.findById(storeId);
    if (!store) {
      return sendResponse(res, 404, false, "Store not found");
    }

    // Handle logo upload
    if (req.files?.logo) {
      const logoPath = req.files.logo[0].path;
      const logoResult = await cloudinary.uploader.upload(logoPath, {
        folder: "uploads/stores/logos",
        resource_type: "image",
      });
      store.logoUrl = logoResult.secure_url;
      fs.unlinkSync(logoPath);
    }

    // Handle cover photo upload
    if (req.files?.coverPhoto) {
      const coverPath = req.files.coverPhoto[0].path;
      const coverResult = await cloudinary.uploader.upload(coverPath, {
        folder: "uploads/stores/coverPhotos",
        resource_type: "image",
      });
      store.coverPhotoUrl = coverResult.secure_url;
      fs.unlinkSync(coverPath);
    }

    // Update store fields
    store.storeName = storeName || store.storeName;
    store.storeAddress = storeAddress || store.storeAddress;

    // Update new fields if provided
    store.city = city || store.city;
    store.state = state || store.state;
    store.pincode = pincode || store.pincode;
    store.address_url = address_url || store.address_url;

    store.position = position || store.position;

    store.limitTime = {
      minimum: limitTime?.minimum || store.limitTime?.minimum || "",
      maximum: limitTime?.maximum || store.limitTime?.maximum || "",
      selectTime: limitTime?.selectTime || store.limitTime?.selectTime || "",
    };

    store.zone = zone || store.zone;
    store.adminId = adminId || store.adminId;
    store.is_deleted = is_deleted !== undefined ? is_deleted : store.is_deleted;

    const updatedStore = await store.save();

    // Now handle seller info update (but skip mobileNo and email)
    if (store.sellerAuthId) {
      const seller = await SellerUserAuth.findById(store.sellerAuthId);
      if (!seller) {
        return sendResponse(res, 404, false, "Seller not found");
      }

      seller.userInfo.firstName = firstName || seller.userInfo.firstName;
      seller.userInfo.lastName = lastName || seller.userInfo.lastName;

      const updatedSeller = await seller.save();

      return sendResponse(res, 200, true, "Store and seller updated successfully", {
        store: updatedStore,
        seller: updatedSeller,
      });
    } else {
      return sendResponse(res, 200, true, "Store updated successfully", {
        store: updatedStore,
      });
    }
  } catch (error) {
    console.error("Update store error:", error);
    return sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};

export const getStores = async (req, res) => {
  try {
    let filter = { is_deleted: false }; 
    const { search = "", zone = "", page = 1, limit = 10 } = req.query;

    if (search) {
      filter.storeName = { $regex: search, $options: "i" };
    }

    if (zone) {
      filter.zone = zone;
    }

    const skip = (page - 1) * limit;

    const stores = await StoreInfo.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("sellerAuthId");

    const totalStores = await StoreInfo.countDocuments(filter);

    return sendResponse(res, 200, true, "Stores fetched successfully", {
      stores,
      totalStores,
      totalPages: Math.ceil(totalStores / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Get stores error:", error);
    return sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const { id: storeId } = req.params;

    const store = await StoreInfo.findByIdAndUpdate(
      storeId,
      { is_deleted: true },
      { new: true }
    );

    if (!store) {
      return sendResponse(res, 404, false, "Store not found");
    }

    if (store.sellerAuthId) {
      await SellerUserAuth.findByIdAndUpdate(
        store.sellerAuthId,
        { is_deleted: true }
      );
    }

    return sendResponse(res, 200, true, "Store and seller deleted", {
      storeId,
      sellerId: store.sellerAuthId,
    });
  } catch (error) {
    console.error("Delete store error:", error);
    return sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};




