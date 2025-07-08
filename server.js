import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/database.js";
import verifyRoute from "./routes/verifyRoute.js";
import adminRoute from "./routes/adminRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import storeRoute from "./routes/storeInfoRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import subCategoryRoute from "./routes/subCategoryRoute.js"
import bannerRoute from "./routes/bannerRoute.js"
import advertisementRoute from "./routes/advertisementRoute.js"
import configRoute from "./routes/configRoute.js"
import orderRoute from "./routes/orderRoute.js"
import colorRoute from "./routes/colorRoute.js"
import customerRoute from "./routes/customerRoute.js"
import contentRoute from "./routes/contentRoute.js"
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import https from "https";

// SSL options
const sslOptions = {
  key: fs.readFileSync(path.resolve("./key.pem")),
  cert: fs.readFileSync(path.resolve("./cert.pem")),
};

dotenv.config({});

const app = express();

const PORT = process.env.PORT || 3002;

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// const corsOption = {
//   origin: "http://localhost:3000",
//   credentials: true,
// };

// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://server.clozzetindia.in"
// ];

const corsOption = {
  origin: (origin, callback) => {
    // if (allowedOrigins.includes(origin) || !origin) {
    //   callback(null, true);
    // } else {
    //   callback(new Error("Not allowed by CORS"));
    // }
    callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOption));

// Serve static files from 'uploads' folder
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/v1/auth", verifyRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/notification", notificationRoute);
app.use("/api/v1/category",categoryRoute);
app.use("/api/v1/subCategory",subCategoryRoute);
app.use("/api/v1/store", storeRoute);
app.use("/api/v1/banner",bannerRoute);
app.use("/api/v1/advertisement",advertisementRoute);
app.use("/api/v1/content",contentRoute);
app.use("/api/v1/config",configRoute);
app.use("/api/v1/order",orderRoute);
app.use("/api/v1/color",colorRoute);
app.use("/api/v1/customer",customerRoute);



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

// https.createServer(sslOptions, app).listen(PORT, () => {
//   connectDB();
//   console.log(`🔒 HTTPS Server is running on https://localhost:${PORT}`);
// });