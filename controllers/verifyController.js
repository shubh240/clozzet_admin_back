import { AdminAuth } from "../models/admin.model.js";

export const verify = async (req, res) => {
  try {
    const user = await AdminAuth.findById(req.id).select("userInfo");
    return res.status(200).json({
      auth: true,
      user: user?.userInfo || null,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ auth: false, message: "Error verifying user" });
  }
};
