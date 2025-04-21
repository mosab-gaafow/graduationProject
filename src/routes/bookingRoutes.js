// bookingRoutes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();


//  GET logged-in user's bookings — placed BEFORE any /:id route
router.get('/myBookings', protectRoute, async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        isDeleted: false,
        trip: {
          isDeleted: false,
        },
      },
      include: {
        trip: true,
      },
      orderBy: {
        bookingTime: 'desc',
      },
    });
    

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching my bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


// Fetch bookings for trips created by the vehicle owner
router.get('/ownerBookings', protectRoute, async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Find all trips created by this owner
    const ownerTrips = await prisma.trip.findMany({
      where: {
        userId: ownerId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const tripIds = ownerTrips.map(trip => trip.id);

    // Fetch bookings for those trips
    const bookings = await prisma.booking.findMany({
      where: {
        tripId: { in: tripIds },
      },
      include: {
        user: {
          select: { name: true, phone: true }
        },
        trip: {
          select: {
            origin: true,
            destination: true,
            date: true,
            time: true,
          },
        },
      },
      orderBy: {
        bookingTime: 'desc',
      },
    });

    console.log("🔑 Owner ID:", ownerId);
console.log("🧳 Trip IDs:", tripIds);
console.log("📦 Bookings fetched:", bookings.length);


if (tripIds.length === 0) {
  console.log("⚠️ No trips created by this owner");
}


    res.json(bookings);
  } catch (err) {
    console.error("Owner Booking Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch owner bookings" });
  }
});



//  CREATE a booking
router.post('/registerBooking', protectRoute, async (req, res) => {
  try {
    const { tripId, seatsBooked } = req.body;
    const userId = req.user.id;

    if (!tripId || !seatsBooked) {
      return res.status(400).json({ error: 'Trip ID and seats required' });
    }

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, isDeleted: false, status: 'PENDING' },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found or not bookable' });
    if (trip.availableSeats < seatsBooked) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    const booking = await prisma.booking.create({
      data: {
        tripId,
        userId,
        seatsBooked,
        status: 'PENDING',
      },
    });

    await prisma.trip.update({
      where: { id: tripId },
      data: {
        availableSeats: { decrement: seatsBooked },
      },
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed', details: err.message });
  }
});


//  GET all bookings (admin use)
router.get('/getAllBookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { trip: true, user: true },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET single booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true, user: true },
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  UPDATE booking
router.put('/:id', async (req, res) => {
  try {
    const { seatsBooked, status } = req.body;

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        seatsBooked,
        status,
      },
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  DELETE booking
router.delete('/:id', async (req, res) => {
  try {
    await prisma.booking.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Booking deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
