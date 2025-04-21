import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'mongodb';
import protectRoute from '../middleware/auth.middleware.js';
import prisma from '../../prisma/client.js';
const router = express.Router();

// Create a new trip
router.post('/registerTrip', protectRoute, async (req, res) => {
  try {
    const {
      origin,
      destination,
      date,
      time,
      price,
      totalSeats,
      vehicleIds,
      status
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
        userId: req.user.id  // <-- Trip owner
      }
      
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Get all trips (filter by origin, destination, or date if provided)
router.get('/getAllTrips', protectRoute, async (req, res) => {
  try {
    const { origin, destination, date, page = 1, limit = 10} = req.query;

    const filters = {
      isDeleted: false,
    };
    
    if (origin) filters.origin = { contains: origin, mode: 'insensitive' };
    if (destination) filters.destination = { contains: destination, mode: 'insensitive' };
    if (date) filters.date = new Date(date);
    if (req.query.status) filters.status = req.query.status; // add this!
    

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Count total filtered trips
    const total = await prisma.trip.count({
      where: filters,
    });

    const trips = await prisma.trip.findMany({
      where: filters,
      skip,
      take,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        origin: true,
        destination: true,
        date: true,
        time: true,
        price: true,
        totalSeats: true,
        availableSeats: true,
        vehicleIds: true, // ✅ Make sure this is included
        status: true
      }
    });

    res.json({
      trips,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
    });
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

    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ error: 'Trip not found or already deleted' });
    }

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
