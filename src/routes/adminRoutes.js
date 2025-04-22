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


export default router;
