// bookingRoutes.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();



/// CREATE a booking
router.post('/', protectRoute, async (req, res) => {
    try {
      const { tripId, seatsBooked } = req.body;
      const userId = req.user.id; // from middleware
  
      if (!tripId || !seatsBooked) return res.status(400).json({ error: 'Trip ID and seats required' });
  
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, isDeleted: false, status: 'PENDING' }
      });
  
      if (!trip) return res.status(404).json({ error: 'Trip not found or not bookable' });
  
      if (trip.availableSeats < seatsBooked)
        return res.status(400).json({ error: 'Not enough seats available' });
  
      const booking = await prisma.booking.create({
        data: {
          tripId,
          userId,
          seatsBooked,
          status: 'PENDING'
        }
      });
  
      await prisma.trip.update({
        where: { id: tripId },
        data: { availableSeats: { decrement: seatsBooked } }
      });
  
      res.status(201).json(booking);
    } catch (err) {
      res.status(500).json({ error: 'Booking failed', details: err.message });
    }
  });
  

/// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { trip: true, user: true },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/// GET single booking by ID
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

/// UPDATE booking
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

/// DELETE booking (soft delete logic can be added if needed)
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




// Confirm booking manually (admin)
// router.patch('/:id/confirm', protectRoute, async (req, res) => {
//     try {
//       const booking = await prisma.booking.update({
//         where: { id: req.params.id },
//         data: {
//           status: 'CONFIRMED',
//           confirmedAt: new Date(),
//         },
//       });
//       res.json({ message: 'Booking confirmed.', booking });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });
  