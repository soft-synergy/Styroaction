import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import requestRoutes from './routes/requests';
import producerRoutes from './routes/producers';
import styrofoamTypeRoutes from './routes/styrofoamTypes';
import priceRoutes from './routes/prices';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware - CORS całkowicie wyłączone (allow all)
// Używamy najprostszej konfiguracji która działa w dev i prod
app.use(cors({
  origin: true, // Pozwala na wszystkie originy
  methods: '*', // Wszystkie metody
  allowedHeaders: '*', // Wszystkie nagłówki
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Dodatkowe CORS headers - zawsze dodajemy dla każdego requestu
app.use((req, res, next) => {
  // Ustaw wszystkie CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Expose-Headers', '*');

  // Obsługa preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24h cache
    return res.status(204).end();
  }

  next();
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styrtoaction';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Check your MongoDB connection string and network access');
      console.error('💡 Make sure your IP is whitelisted in MongoDB Atlas');
    }
  });

// Routes
app.use('/api/requests', requestRoutes);
app.use('/api/producers', producerRoutes);
app.use('/api/styrofoam-types', styrofoamTypeRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

