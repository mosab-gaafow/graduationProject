import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js'; // Adjust the path if needed

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized, access denied" });
    }

    const token = authHeader.split(" ")[1];
    // console.log("Verifying token:", token);
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
// console.log("🧾 Decoded JWT:", decoded);


    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }, 
    
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Token is not valid or user is deleted" });
    }

    req.user = user;
    next();

  } catch (e) {
    console.error("Auth error:", e.message);
    return res.status(401).json({ message: "Unauthorized, access denied" });
  }
};

export default protectRoute;
