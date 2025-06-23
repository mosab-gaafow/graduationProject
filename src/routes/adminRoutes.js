import express from 'express';
import prisma from '../../prisma/client.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/summaryStats', protectRoute, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { isDeleted: false } });
    const totalTrips = await prisma.trip.count({ where: { isDeleted: false } });
    const totalVehicles = await prisma.vehicle.count({ where: { isDeleted: false } });
    const totalBookings = await prisma.booking.count({ where: { isDeleted: false } });

    const recentUsers = await prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ totalUsers, totalTrips, totalVehicles, totalBookings, recentUsers });
  } catch (err) {
    console.error("Summary stats error:", err);
    res.status(500).json({ error: 'Failed to fetch summary statistics' });
  }
});

router.get('/vehcilestats', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const [vehicleCount, tripCount, userCount] = await Promise.all([
      prisma.vehicle.count({ where: { isDeleted: false } }),
      prisma.trip.count({ where: { isDeleted: false } }),
      prisma.user.count(),
    ]);

    res.json({
      totalVehicles: vehicleCount,
      totalTrips: tripCount,
      totalUsers: userCount,
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ message: "Failed to load statistics" });
  }
});


// Admin: Mark a payment as verified
router.patch('/verifyPayment/:bookingId', protectRoute, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentVerified: true },
    });

    res.json({ message: 'Payment marked as verified', booking: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});





// // Update user profile (excluding role)
// router.put('/update-profile', protectRoute, async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const userId = req.user.id; // Get the logged-in user ID

//     // Validate input
//     if (!name || !email || !password) {
//       return res.status(400).json({ error: 'Name, Email, and Password are required' });
//     }

//     // Find the existing user
//     const existingUser = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!existingUser) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Hash password (make sure you have a hashing function in place)
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Update user data
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//       },
//     });

//     res.json(updatedUser);
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     res.status(500).json({ error: 'Failed to update profile', details: error.message });
//   }
// });


router.put('/update-profile', protectRoute, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const userId = req.user.id;

    // Enhanced validation
    if (!name && !email && !phone && !password) {
      return res.status(400).json({ 
        success: false,
        error: 'At least one field must be provided for update' 
      });
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Email change validation
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    const updateData = {
      name: name || existingUser.name,
      email: email || existingUser.email,
      phone: phone !== undefined ? phone : existingUser.phone,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
