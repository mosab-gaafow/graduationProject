import express from 'express';
import dotenv from 'dotenv/config';
import authRoutes from './routes/authRoutes.js';

import { connectDB } from './lib/db.js';
import cors from 'cors';
import job from './lib/cron.js';

const app = express();
const PORT = process.env.PORT || 4000;

job.start(); // Start the cron job, when using physical phone.
app.use(express.json());
// app.use(express.json({ limit: '10mb' })); // for large image uploads
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use(cors());

app.use("/api/auth", authRoutes)

app.listen(PORT, () => {
    console.log('Server is running on port 4000');
    connectDB();
});

