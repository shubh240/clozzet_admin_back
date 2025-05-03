import { StoreInfo } from "../models/sellerStoreInfo.model.js"; 
import { SellerUserAuth } from "../models/sellerUserInfo.model.js"; 
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import bcrypt from "bcryptjs";

export const addStore = async (req, res) => {
  try {
    const adminId = req.id;
    console.log(`adminId: ${adminId}`);

    const { firstName, lastName, mobileNo, email, password, confirmPassword } =
      req.body;

    console.log({
      firstName,
      lastName,
      mobileNo,
      email,
      password,
      confirmPassword,
    });

    if (
      !firstName ||
      !lastName ||
      !mobileNo ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All seller fields are required.",
        success: false,
      });
    }


    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and confirm password should be the same.",
        success: false,
      });
    }

    const existingUser = await SellerUserAuth.findOne({
      "userInfo.mobileNo": mobileNo,
    });
    if (existingUser) {
      return res.status(400).json({
        message: "Mobile number already registered.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSeller = new SellerUserAuth({
      userInfo: { firstName, lastName, mobileNo },
      userAuth: { email, password: hashedPassword },
      adminId,
    });

    await newSeller.save();



    const {
      storeName,
      storeAddress,
      limitTime,
      position,
      zone,

    } = req.body;

    console.log({
      storeName,
      storeAddress,
      position,
      limitTime,
      zone,
    });

   // const sellerAuthId = req.id;
    //console.log(`sellerAuthId: ${sellerAuthId}`);

    // Basic validation
    if (!storeName || !storeAddress) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // Check if store name already exists
    let gotStore = await StoreInfo.findOne({ storeName });
    if (gotStore) {
      return res.status(400).json({
        message: "Store with this name already exists.",
        success: false,
      });
    }

    let parsedPosition = {};
    let parsedLimitTime = {};

    try {
      parsedPosition = JSON.parse(position);
    } catch (e) {
      console.error("Invalid position JSON");
    }

    try {
      parsedLimitTime = JSON.parse(limitTime);
    } catch (e) {
      console.error("Invalid limitTime JSON");
    }

    let logoUrl = "";
    let coverPhotoUrl = "";

    console.log("Files received:", req.files);

    // Upload logo if available

    if (req.files["logo"]) {
      const imagePath = req.files["logo"][0].path;
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/stores/logos",
        resource_type: "image",
      });
      logoUrl = imageResult.secure_url;
      console.log(`Logo url : ${logoUrl}`);
      fs.unlinkSync(imagePath); // Delete local file after upload
    }
    // Upload cover photo if available

    if (req.files["coverPhoto"]) {
      const imagePath = req.files["coverPhoto"][0].path;
      const imageResult = await cloudinary.uploader.upload(imagePath, {
        folder: "uploads/stores/coverPhotos",
        resource_type: "image",
      });
      coverPhotoUrl = imageResult.secure_url;
      console.log(`cover photo url : ${coverPhotoUrl}`);
      fs.unlinkSync(imagePath); // Delete local file after upload
    }

    const newStore = new StoreInfo({
      storeName,
      storeAddress,
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
    
    

    return res
      .status(201)
      .json({ message: "Store created successfully", store: savedStore, seller: newSeller, success: true});
  } catch (error) {
    console.error("Error creating store:", error);
    return res
      .status(500)
      .json({
        message: "Internal server error",
        error: error.message,
        success: false,
      });
  }
};

export const updateStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      storeName,
      storeAddress,
      storeTaxInfo,
      latitude,
      longitude,
      zone,
      mapAddress,
    } = req.body;

    const store = await StoreInfo.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ message: "Store not found", success: false });
    }

    // File updates
    if (req.files?.logo) {
      const logoPath = req.files.logo[0].path;
      const logoResult = await cloudinary.uploader.upload(logoPath, {
        folder: "uploads/stores/logos",
        resource_type: "image",
      });
      store.logoUrl = logoResult.secure_url;
      fs.unlinkSync(logoPath);
    }

    if (req.files?.coverPhoto) {
      const coverPath = req.files.coverPhoto[0].path;
      const coverResult = await cloudinary.uploader.upload(coverPath, {
        folder: "uploads/stores/coverPhotos",
        resource_type: "image",
      });
      store.coverPhotoUrl = coverResult.secure_url;
      fs.unlinkSync(coverPath);
    }

    store.storeName = storeName || store.storeName;
    store.storeAddress = storeAddress || store.storeAddress;
    store.storeTaxInfo = storeTaxInfo || store.storeTaxInfo;
    store.storeLocation = {
      latitude: latitude || store.storeLocation.latitude,
      longitude: longitude || store.storeLocation.longitude,
      zone: zone || store.storeLocation.zone,
      mapAddress: mapAddress || store.storeLocation.mapAddress,
    };

    const updatedStore = await store.save();
    res
      .status(200)
      .json({ message: "Store updated", store: updatedStore, success: true });
  } catch (error) {
    console.error("Update store error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const getStores = async (req, res) => {
  try {
    const adminId = req.id;
    const stores = await StoreInfo.find({ adminId }).populate("sellerAuthId");

    res.status(200).json({ stores, success: true });
  } catch (error) {
    console.error("Get stores error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await StoreInfo.findByIdAndDelete(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ message: "Store not found", success: false });
    }

    res
      .status(200)
      .json({ message: "Store deleted successfully", success: true });
  } catch (error) {
    console.error("Delete store error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};




