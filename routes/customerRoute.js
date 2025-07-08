import express from "express";
import {
listCustomers
} from "../controllers/customerController.js";
import {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";

const router = express.Router();

router.post("/list",isSuperAdminAuthenticated, listCustomers);

export default router;
