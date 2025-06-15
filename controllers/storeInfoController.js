import { StoreInfo } from "../models/sellerStoreInfo.model.js";
import { SellerUserAuth } from "../models/sellerUserInfo.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import { sendResponse } from "../common/index.js";

export const addStore = async (req, res) => {
  try {
    const adminId = req.id;

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
      ifscCode,
      accountNumber,
      accountHolderName,
      bankName
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !mobileNo ||
      !email ||
      !password ||
      !confirmPassword ||
      !storeName ||
      !storeAddress ||
      !city ||
      !state ||
      !pincode ||
      !ifscCode || !accountNumber || !accountHolderName || !bankName
    ) {
      return sendResponse(
        res,
        400,
        false,
        "All required fields (seller + store + bank) must be filled."
      );
    }

    if (password !== confirmPassword) {
      return sendResponse(
        res,
        400,
        false,
        "Password and confirm password should be the same."
      );
    }

    /**
     * Bank Code Start
     */
    // const accountNumberRegex = /^[0-9]{9,18}$/;
    // const holderNameRegex = /^[a-zA-Z\s]{3,50}$/;

    // if (!accountNumberRegex.test(accountNumber)) {
    //   return sendResponse(res, 400, false, "Invalid account number. It must be 9 to 18 digits.");
    // }

    // if (!holderNameRegex.test(accountHolderName)) {
    //   return sendResponse(res, 400, false, "Account holder name must contain only letters and spaces.");
    // }
    /**
     * Bank Code End
     */
    const existingUser = await SellerUserAuth.findOne({
      "userInfo.mobileNo": mobileNo,
    });
    if (existingUser) {
      return sendResponse(res, 400, false, "Mobile number already registered.");
    }

    // const gotStore = await StoreInfo.findOne({ storeName });
    // if (gotStore) {
    //   return sendResponse(res, 400, false, "Store with this name already exists.");
    // }

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
    }else {
      return sendResponse(res, 400, false, "Cover photo is required.");
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
      },
      zone,
      ifscCode,
      accountNumber,
      accountHolderName,
      bankName,
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
      zone,
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
      ifscCode,
      accountNumber,
      accountHolderName,
      bankName,
    } = req.body;

    /**
     * Bank Code Start
     */
    // const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    // const accountNumberRegex = /^[0-9]{9,18}$/;
    // const holderNameRegex = /^[a-zA-Z\s]{3,50}$/;

    // if (!ifscRegex.test(ifscCode)) {
    //   return sendResponse(res, 400, false, "Invalid IFSC code. It should follow Indian IFSC format.");
    // }

    // if (!accountNumberRegex.test(accountNumber)) {
    //   return sendResponse(res, 400, false, "Invalid account number. It must be 9 to 18 digits.");
    // }

    // if (!holderNameRegex.test(accountHolderName)) {
    //   return sendResponse(res, 400, false, "Account holder name must contain only letters and spaces.");
    // }
    /**
     * Bank Code End
     */

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
    store.city = city || store.city;
    store.state = state || store.state;
    store.pincode = pincode || store.pincode;
    store.address_url = address_url || store.address_url;
    store.position = position || store.position;

    store.limitTime = {
      minimum: limitTime?.minimum || store.limitTime?.minimum || "",
      maximum: limitTime?.maximum || store.limitTime?.maximum || "",
    };

    store.zone = zone || store.zone;
    store.adminId = adminId || store.adminId;
    store.is_deleted = is_deleted !== undefined ? is_deleted : store.is_deleted;

    // Update bank details if provided
    store.ifscCode = ifscCode || store.ifscCode;
    store.accountNumber = accountNumber || store.accountNumber;
    store.accountHolderName = accountHolderName || store.accountHolderName;
    store.bankName = bankName || store.bankName;
    
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

      return sendResponse(
        res,
        200,
        true,
        "Store and seller updated successfully",
        {
          store: updatedStore,
          seller: updatedSeller,
        }
      );
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
      await SellerUserAuth.findByIdAndUpdate(store.sellerAuthId, {
        is_deleted: true,
      });
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

export const getStoreById = async (req, res) => {
  try {
    const { id: storeId } = req.params;

    const store = await StoreInfo.findById(storeId).populate("sellerAuthId");

    if (!store || store.is_deleted) {
      return sendResponse(res, 404, false, "Store not found");
    }

    return sendResponse(res, 200, true, "Store fetched successfully", {
      store,
    });
  } catch (error) {
    console.error("Get store by ID error:", error);

    return sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};

export const toggleStoreStatus = async (req, res) => {
  try {
    const { id: storeId } = req.params;

    const store = await StoreInfo.findById(storeId);
    if (!store || store.is_deleted) {
      return sendResponse(res, 404, false, "Store not found.");
    }

    // Toggle storeOn: true -> false or false -> true
    store.storeOn = !store.storeOn;
    const updatedStore = await store.save();

    return sendResponse(
      res,
      200,
      true,
      `Store has been turned ${updatedStore.storeOn ? "ON" : "OFF"}.`,
      { store: updatedStore }
    );
  } catch (error) {
    console.error("Toggle store status error:", error);
    return sendResponse(res, 500, false, "Internal server error", {
      error: error.message,
    });
  }
};

export const updateSellerPassword = async (req, res) => {
  try {
    const { id: sellerId } = req.params;
    const { password } = req.body;

    if (!password) {
      return sendResponse(res, 400, false, "Password is required.");
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await SellerUserAuth.findById(sellerId);

    if (!seller) {
      return sendResponse(res, 404, false, "Seller not found.");
    }

    seller.userAuth.password = hashedPassword;
    await seller.save();

    return sendResponse(res, 200, true, "Password updated successfully.");
  } catch (error) {
    console.error("Error updating password:", error);
    return sendResponse(res, 500, false, error.message);
  }
};
