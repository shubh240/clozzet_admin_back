import jwt from "jsonwebtoken";

const isUserAuthenticated = async (req, res, next) => {
   try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

     if (!token) {
       return res
         .status(401)
         .json({ auth: false, message: "User is not authenticated" });
     }

     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
     if (!decoded || !decoded.userId) {
       return res.status(401).json({ auth: false, message: "Invalid token" });
     }

     req.id = decoded.userId;
     next();
   } catch (error) {
     console.log("JWT verify error:", error.message);
     return res
       .status(401)
       .json({ auth: false, message: "Token verification failed" });
   }
};
export default isUserAuthenticated;
