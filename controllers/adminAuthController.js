import { AdminAuth } from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {sendResponse} from "../common/index.js"
export const signup = async (req, res) => {
  console.log("Req: ", req.body);
  try {
    console.log("sign up admin");
    
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    const admin = await AdminAuth.findOne({ "userAuth.email": email });
    if (admin) {
      return sendResponse(res, 400, false, "Admin already exists with this email.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await AdminAuth.create({
      userInfo: {
        firstName,
        lastName,
      },
      userAuth: {
        email,
        password: hashedPassword,
      },
    });

    return sendResponse(res, 201, true, "Account created successfully.", {adminId: newAdmin._id});

  } catch (error) {
    console.log(`Sign up admin error: ${error}`);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

export const login = async (req, res) => {
  try {
    console.log("Log in admin");
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    const admin = await AdminAuth.findOne({ "userAuth.email": email }).select(
      "userAuth.password userInfo"
    );
    if (!admin) {
      return sendResponse(res, 400, false, "Incorrect email");
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      admin.userAuth?.password
    );
    if (!isPasswordCorrect) {
      return sendResponse(res, 400, false, "Incorrect password");
    }

    const tokenData = {
      userId: admin._id,
    };

    console.log("tokenData:", tokenData)

    const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    console.log("token: ", token);

    // Set cookie and send response
    res.cookie("super-admin-token", token, {
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      sameSite: "strict",
    });

    return sendResponse(res, 200, true, "Login successful", {
      _id: admin._id,
      firstName: admin.userInfo?.firstName,
      lastName: admin.userInfo?.lastName,
      email: admin.userAuth?.email,
      token
    });
  } catch (error) {
    console.log(`Log in admin error: ${error}`);
    return sendResponse(res, 500, false, "Internal server error");
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("super-admin-token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", // optional for HTTPS
    });

    return sendResponse(res, 200, true, "Logged out successfully");
  } catch (error) {
    console.log("Logout error:", error);
    return sendResponse(res, 500, false, "Internal server error");
  }
};
