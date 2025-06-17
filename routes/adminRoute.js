import express from "express";
import {
  signup,
  login,
  logout,
 
} from "../controllers/adminAuthController.js";
import isUserAuthenticated , {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout",logout);

console.log("Admin route")

export default router;
