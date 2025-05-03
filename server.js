import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/database.js";
import verifyRoute from "./routes/verifyRoute.js";
import adminRoute from "./routes/adminRoute.js";
import storeRoute from "./routes/storeInfoRoute.js";
import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";


dotenv.config({});

const app = express();

const PORT = process.env.PORT || 5000;

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// const corsOption = {
//   origin: "http://localhost:3000",
//   credentials: true,
// };

const corsOption = {
  origin: "*",
  credentials: true,
};


app.use(cors(corsOption));

// Serve static files from 'uploads' folder
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/v1/auth", verifyRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/store", storeRoute);



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.resolve(__dirname, "../admin/build");
app.use(express.static(clientBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(clientBuildPath, "index.html"));
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is listening at port ${PORT}`);
});
