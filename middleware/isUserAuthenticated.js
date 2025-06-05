import jwt from "jsonwebtoken";
import {AdminAuth} from "../models/admin.model.js"; 

const isUserAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ auth: false, message: "Token is missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ auth: false, message: "Invalid token" });
    }

    const admin = await AdminAuth.findById(decoded.userId);
    if (!admin || admin.token !== token) {
      return res.status(401).json({ auth: false, message: "Token mismatch or admin not found" });
    }

    req.id = admin._id;
    next();
  } catch (error) {
    console.log("JWT verify error:", error.message);
    return res.status(401).json({ auth: false, message: "Token verification failed" });
  }
};

export default isUserAuthenticated;
