import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'mongodb';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new trip
router.post('/', protectRoute, async (req, res) => {
  try {
    const {
      origin,
      destination,
      date,
      time,
      price,
      totalSeats,
      vehicleIds,
    } = req.body;

    const trip = await prisma.trip.create({
      data: {
        origin,
        destination,
        date: new Date(date),
        time,
        price: parseFloat(price),
        totalSeats: parseInt(totalSeats),
        availableSeats: parseInt(totalSeats),
        vehicleIds,
      },
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Get all trips (filter by origin, destination, or date if provided)
router.get('/', protectRoute, async (req, res) => {
    try {
      //  console.log("🔥 User making request:", req.user);
      const { origin, destination, date } = req.query;
  
      const filters = {
        isDeleted: false,
      };
  
      if (origin) filters.origin = origin;
      if (destination) filters.destination = destination;
      if (date) filters.date = new Date(date);
  
      const trips = await prisma.trip.findMany({
        where: filters,
        orderBy: { date: 'asc' },
      });
  
      res.json(trips);
    } catch (error) {
      console.error('🔥 Detailed trips fetch error:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Failed to get trips', details: error.message });
    }
  });

// Get trip by ID
router.get('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip || trip.isDeleted) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to get trip' });
  }
});

// Update a trip
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const trip = await prisma.trip.update({
      where: { id },
      data,
    });

    res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Soft delete trip
router.delete('/:id', protectRoute,  async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ message: 'Trip deleted (soft)', trip });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;
