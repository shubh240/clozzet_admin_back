import express from "express";
import {
listCustomers,
exportCustomers
} from "../controllers/customerController.js";
import {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";

const router = express.Router();

router.post("/list",isSuperAdminAuthenticated, listCustomers);

router.post("/export",isSuperAdminAuthenticated, exportCustomers);

export default router;
