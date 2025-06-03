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

// Get all trips (filter by origin, destination, or date if provided)
// router.get('/getAllTrips', protectRoute, async (req, res) => {
//   try {
//     const { origin, destination, date, page = 1, limit = 10} = req.query;

//     const filters = {
//       isDeleted: false,
//     };
    
//     if (origin) filters.origin = { contains: origin, mode: 'insensitive' };
//     if (destination) filters.destination = { contains: destination, mode: 'insensitive' };
//     if (date) filters.date = new Date(date);
//     if (req.query.status) filters.status = req.query.status; // add this!
    

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const take = parseInt(limit);

//     // Count total filtered trips
//     const total = await prisma.trip.count({
//       where: filters,
//     });

//     const trips = await prisma.trip.findMany({
//       where: filters,
//       skip,
//       take,
//       orderBy: { date: 'asc' },
//       select: {
//         id: true,
//         origin: true,
//         destination: true,
//         date: true,
//         time: true,
//         price: true,
//         totalSeats: true,
//         availableSeats: true,
//         vehicleIds: true, // ✅ Make sure this is included
//         status: true
//       }
//     });

//     res.json({
//       trips,
//       total,
//       totalPages: Math.ceil(total / take),
//       currentPage: parseInt(page),
//     });
//   } catch (error) {
//     console.error('🔥 Detailed trips fetch error:', JSON.stringify(error, null, 2));
//     res.status(500).json({ error: 'Failed to get trips', details: error.message });
//   }
// });

// router.get('/getAllTrips', protectRoute, async (req, res) => {
//   try {
//     const { origin, destination, date, page = 1, limit = 10, status } = req.query;

//     const filters = {
//       isDeleted: false,
//     };

//     if (origin) filters.origin = { contains: origin, mode: 'insensitive' };
//     if (destination) filters.destination = { contains: destination, mode: 'insensitive' };
//     if (date) filters.date = new Date(date);
//     if (status) filters.status = status;

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const take = parseInt(limit);

//     const total = await prisma.trip.count({ where: filters });

//     const trips = await prisma.trip.findMany({
//       where: filters,
//       skip,
//       take,
//       orderBy: { date: 'asc' },
//       include: {
//         user: {
//           select: {
//             name: true,
//             phone: true, // 👈 includes trip owner's EVC+ number
//           },
//         },
//       },
//     });

//     res.json({
//       trips,
//       total,
//       totalPages: Math.ceil(total / take),
//       currentPage: parseInt(page),
//     });
//   } catch (error) {
//     console.error('🔥 Detailed trips fetch error:', JSON.stringify(error, null, 2));
//     res.status(500).json({ error: 'Failed to get trips', details: error.message });
//   }
// });

router.get('/getAllTrips', protectRoute, async (req, res) => {
  try {
    const { origin, destination, date, page = 1, limit = 10, status } = req.query;

    const filters = {
      isDeleted: false,
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
            status: { in: ['PENDING', 'CONFIRMED'], isDeleted: false },
            
          },
          select: {
            seatsBooked: true,
          },
        },
      },
    });

    // 🔄 Calculate dynamic availableSeats
    const formattedTrips = trips.map((trip) => {
      const totalBooked = trip.bookings.reduce((sum, b) => sum + b.seatsBooked, 0);
      return {
        ...trip,
        availableSeats: trip.totalSeats - totalBooked,
      };
    });

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

// router.get('/ownerEarnings', protectRoute, async (req, res) => {
//   try {
//     const ownerId = req.user.id;

//     // Get all trips posted by this owner
//     const trips = await prisma.trip.findMany({
//       where: { userId: ownerId, isDeleted: false },
//       select: { id: true },
//     });

//     const tripIds = trips.map((t) => t.id);

//     const bookings = await prisma.booking.findMany({
//       where: {
//         tripId: { in: tripIds },
//         paymentStatus: 'paid',
//       },
//     });

//     const totalEarnings = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);

//     res.json({
//       totalEarnings,
//       totalBookings: bookings.length,
//       bookings,
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to get owner earnings' });
//   }
// });


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



// router.post("/repairSeats", protectRoute, async (req, res) => {
//   try {
//     // Optional: check if user is admin
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ error: "Not authorized" });
//     }

//     const trips = await prisma.trip.findMany({
//       where: { isDeleted: false },
//       select: { id: true, totalSeats: true },
//     });

//     for (const trip of trips) {
//       const confirmedBookings = await prisma.booking.findMany({
//         where: {
//           tripId: trip.id,
//           status: { in: ['PENDING', 'CONFIRMED'] },
//         },
//       });

//       const bookedSeats = confirmedBookings.reduce(
//         (sum, b) => sum + b.seatsBooked,
//         0
//       );

//       const newAvailable = trip.totalSeats - bookedSeats;

//       await prisma.trip.update({
//         where: { id: trip.id },
//         data: { availableSeats: newAvailable },
//       });

//       console.log(`✅ Fixed Trip ${trip.id}: availableSeats = ${newAvailable}`);
//     }

//     res.json({ message: "Seats repaired for all trips." });
//   } catch (err) {
//     console.error("Repair error:", err.message);
//     res.status(500).json({ error: "Failed to repair seats" });
//   }
// });



export default router;
