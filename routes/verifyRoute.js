import express from "express";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";
import { verify } from "../controllers/verifyController.js";

const router = express.Router();

router.get("/verify", isUserAuthenticated, verify);

export default router;
