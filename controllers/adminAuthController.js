import { AdminAuth } from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  console.log("Req: ", req.body);
  try {
    console.log("sign up admin");
    
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await AdminAuth.findOne({ "userAuth.email": email });
    if (admin) {
      return res.status(400).json({
        message: "Admin already exists with this email.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await AdminAuth.create({
      userInfo: {
        firstName,
        lastName,
      },
      userAuth: {
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log(`Sign up admin error: ${error}`);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    console.log("Log in admin");
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await AdminAuth.findOne({ "userAuth.email": email }).select(
      "userAuth.password userInfo"
    );
    if (!admin) {
      return res.status(400).json({
        message: "Incorrect email",
        success: false,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      admin.userAuth?.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Incorrect password",
        success: false,
      });
    }

    const tokenData = {
      userId: admin._id,
    };

    console.log("tokenData:", tokenData)

    const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    console.log("token: ", token);

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        _id: admin._id,
        firstName: admin.userInfo?.firstName,
        lastName: admin.userInfo?.lastName,
        email: admin.userAuth?.email,
      });
  } catch (error) {
    console.log(`Log in admin error: ${error}`);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const logout = (req, res) => {
  console.log("Inside log out admin");
  try {
      console.log("Inside log out admin try");

    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};


