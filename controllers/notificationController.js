import { sendResponse } from "../common/index.js";
import { CustomerNotification } from "../models/customerNotification.model.js";
import { Customer } from "../models/customer.model.js";
import { SellerUserAuth } from "../models/sellerUserInfo.model.js";
import { SellerNotification } from "../models/sellerNotification.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const sendNotification  = async(req,res)=>{
 try {
    const { type, title, body } = req.body;

    if (!type || !["customer", "seller"].includes(type)) {
      return sendResponse(res, 400, false, "type must be 'customer' or 'seller'");
    }
    let imageUrl = null;
    if(req.files["image"]){
        const imagePath = req.files["image"][0].path;
          const imageResult = await cloudinary.uploader.upload(imagePath, {
            folder: "uploads/notifications/images",
            resource_type: "image",
          });
      
        imageUrl = imageResult.secure_url;
        fs.unlinkSync(imagePath); 
    }

    const Model = type === "customer" ? Customer : SellerUserAuth;
    const NotificationModel = type === "customer" ? CustomerNotification : SellerNotification;
    const idField = type === "customer" ? "customerId" : "sellerId";

    const users = await Model.find({
      fcmToken: { $exists: true, $ne: null },
    });

    if (!users.length) {
      return sendResponse(res, 200, true, `No ${type}s with valid FCM tokens`);
    }

    const sendResults = await Promise.all(
      users.map(async (user) => {
        try {
          await NotificationModel.create({
            [idField]: user._id,
            title,
            body,
            image : imageUrl,
          });
          return true;
        } catch (err) {
          console.error(`Failed for ${user._id}:`, err.message);
          return false;
        }
      })
    );

    const successCount = sendResults.filter(Boolean).length;

    return sendResponse(
      res,
      200,
      true,
      `Notification sent to ${successCount}/${users.length} ${type}(s)`
    );
  } catch (err) {
    console.error("Send Notification Error:", err);
    return sendResponse(res, 500, false, "Internal Server Error");
  }
}