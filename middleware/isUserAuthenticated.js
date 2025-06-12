import jwt from "jsonwebtoken";
import { AdminAuth } from "../models/admin.model.js";

import { Customer } from "../models/customer.model.js";
import { SellerUserAuth } from "../models/sellerUserInfo.model.js";
import { sendResponse } from "../common/index.js";

const isUserAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendResponse(res, 400, false, "Token missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendResponse(res, 401, false, "Token has expired. Please log in again.");
      }
      return sendResponse(res, 401, false, "Invalid token");
    }

    if (!decoded || !decoded.userId) {
      return sendResponse(res, 401, false, "Invalid token");
    }
console.log("Decoded token:", decoded);

    const [admin, seller, customer] = await Promise.all([
      AdminAuth.findById(decoded.userId),
      SellerUserAuth.findById(decoded.userId),
      Customer.findById(decoded.userId),
    ]);

    if (admin && admin.token === token) {
      req.id = admin._id;
      req.role = "admin";
    } else if (seller && seller.token === token) {
      req.id = seller._id;
      req.role = "seller";
    } else if (customer && customer.token === token) {
      req.id = customer._id;
      req.role = "customer";
    } else {
      return sendResponse(res, 401, false, "Token mismatch or user not found");
    }

    next();
  } catch (error) {
    console.error("JWT verify error:", error.message);
    return sendResponse(res, 401, false, "Token verification failed");
  }
};

const isUserAuthenticatedOld = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ auth: false, message: "Token is missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ auth: false, message: "Invalid token" });
    }

    const admin = await AdminAuth.findById(decoded.userId);
    if (!admin || admin.token !== token) {
      return res
        .status(401)
        .json({ auth: false, message: "Token mismatch or admin not found" });
    }

    req.id = admin._id;
    next();
  } catch (error) {
    console.log("JWT verify error:", error.message);
    return res
      .status(401)
      .json({ auth: false, message: "Token verification failed" });
  }
};

export default isUserAuthenticated;
