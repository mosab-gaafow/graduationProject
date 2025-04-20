import jwt from 'jsonwebtoken';

import User from '../models/User.js';

const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized, Access denied" });
        }

        const token = authHeader.split(" ")[1]; // ✅ Extract the token correctly

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Token is not valid" });
        }

        req.user = user;
        next();

    } catch (e) {
        console.log("Auth error:", e.message);
        return res.status(401).json({ message: "Unauthorized, Access denied" });
    }
};


export default protectRoute;
