import express from 'express';
import prisma from '../../prisma/client.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// Add new vehicle
// Add new vehicle
router.post('/registerVehicles', protectRoute, async (req, res) => {
  try {
    const { plateNumber, model, capacity, type, userId } = req.body;

    if (!plateNumber || !model || !capacity || !type || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!plateNumber || !model || !capacity || !type || !userId) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    
    const existingVehicle = await prisma.vehicle.findUnique({ where: { plateNumber } });
    if (existingVehicle) {
      return res.status(400).json({ message: "Plate number already exists" });
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        plateNumber,
        model,
        capacity: parseInt(capacity),
        type,
        userId,
      },
    });

    res.status(201).json(newVehicle);
  } catch (err) {
    console.error("Create vehicle error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// ✅ Get all vehicles of the current user (vehicle owner)
router.get('/my', protectRoute, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: req.user.id,      // Only fetch vehicles of the logged-in user
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(vehicles);
  } catch (err) {
    console.error("Get vehicles error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get all vehicles (admin only)
router.get('/getAllVehciles', protectRoute, async (req, res) => {
    try {
      // Check role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }
  
      const vehicles = await prisma.vehicle.findMany({
        where: {
          isDeleted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
  
      res.status(200).json(vehicles);
    } catch (err) {
      console.error("Admin fetch vehicles error:", err.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  });


// Update a vehicle
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const { plateNumber, model, capacity,  type } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle || vehicle.isDeleted) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this vehicle" });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber,
        model,
        capacity: parseInt(capacity),
        
        type,
      },
    });

    res.status(200).json(updatedVehicle);
  } catch (err) {
    console.error("Update vehicle error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Soft delete vehicle
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle || vehicle.isDeleted) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this vehicle" });
    }

    await prisma.vehicle.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Delete vehicle error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
