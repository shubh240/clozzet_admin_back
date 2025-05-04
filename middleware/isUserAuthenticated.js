import jwt from "jsonwebtoken";

const isUserAuthenticated = async (req, res, next) => {
   try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    console.log("Token is", token);

     if (!token) {
       return res
         .status(401)
         .json({ auth: false, message: "User is not authenticated" });
     }
     console.log("JWT Secret Key:", process.env.JWT_SECRET_KEY);

     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
     if (!decoded || !decoded.userId) {
       return res.status(401).json({ auth: false, message: "Invalid token" });
     }

     console.log("Decoded:", decoded);
     req.id = decoded.userId; // for downstream use
     next();
   } catch (error) {
     console.log("JWT verify error:", error.message);
     return res
       .status(401)
       .json({ auth: false, message: "Token verification failed" });
   }
};
export default isUserAuthenticated;
