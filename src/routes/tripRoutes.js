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
        userId: req.user.id , // <-- Trip owner
        status, 
      }
      
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});


router.get('/getAllTrips', protectRoute, async (req, res) => {
  try {
    const { origin, destination, date, page = 1, limit = 10, status } = req.query;

    const filters = {
      isDeleted: false,
      userId: req.user.id,
    };

    if (origin) filters.origin = { contains: origin, mode: 'insensitive' };
    if (destination) filters.destination = { contains: destination, mode: 'insensitive' };
    if (date) filters.date = new Date(date);
    if (status) filters.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const total = await prisma.trip.count({ where: filters });

    const trips = await prisma.trip.findMany({
      where: filters,
      skip,
      take,
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        bookings: {
          where: {
             isDeleted: false,
            status: { in: ['PENDING', 'CONFIRMED'] },
            
          },
          select: {
            seatsBooked: true,
          },
        },
      },
    });

   

    const formattedTrips = Array.isArray(trips)
  ? trips.map((trip) => {
      const totalBooked = trip.bookings.reduce((sum, b) => sum + b.seatsBooked, 0);
      return {
        ...trip,
        availableSeats: trip.totalSeats - totalBooked,
      };
    })
  : [];


    res.json({
      trips: formattedTrips,
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

    // const trip = await prisma.trip.findUnique({
    //   where: { id },
    // });

    // if (!trip || trip.isDeleted) {
    //   return res.status(404).json({ error: 'Trip not found' });
    // }

    const trip = await prisma.trip.findUnique({
  where: { id },
});

if (!trip || trip.isDeleted || trip.userId !== req.user.id) {
  return res.status(404).json({ error: 'Trip not found or unauthorized' });
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

    // const existing = await prisma.trip.findUnique({ where: { id } });
    // if (!existing || existing.isDeleted) {
    //   return res.status(404).json({ error: 'Trip not found or already deleted' });
    // }

    const existing = await prisma.trip.findUnique({ where: { id } });

if (!existing || existing.isDeleted || existing.userId !== req.user.id) {
  return res.status(404).json({ error: 'Trip not found or unauthorized' });
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

    // const trip = await prisma.trip.update({
    //   where: { id },
    //   data: { isDeleted: true },
    // });

    const existing = await prisma.trip.findUnique({ where: { id } });

if (!existing || existing.isDeleted || existing.userId !== req.user.id) {
  return res.status(404).json({ error: 'Trip not found or unauthorized' });
}

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


router.get("/ownerEarnings", protectRoute, async (req, res) => {
  try {
    const ownerId = req.user.id;

    const ownerTrips = await prisma.trip.findMany({
      where: { userId: ownerId, isDeleted: false },
      select: { id: true },
    });

    const tripIds = ownerTrips.map((t) => t.id);

    const bookings = await prisma.booking.findMany({
      where: {
        tripId: { in: tripIds },
        paymentStatus: 'paid',
        paymentVerified: true,
      },
      select: {
        id: true,
        amountPaid: true,
        paymentStatus: true,
        paymentVerified: true,
      },
    });

    console.log("📦 Owner Booking Records:", bookings); // <--- ADD THIS

    const totalEarnings = bookings.reduce(
      (sum, b) => sum + (b.amountPaid || 0),
      0
    );

    res.json({
      totalBookings: bookings.length,
      totalEarnings,
    });
  } catch (err) {
    console.error("Owner earnings fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

