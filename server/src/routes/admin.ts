import express, { Request, Response } from 'express';
import AdminModel from '../models/Admin';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    // Allow login by both username and email
    const admin = await AdminModel.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, admin: { id: admin._id, username: admin.username, email: admin.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create admin (for initial setup - should be protected in production)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const admin = new AdminModel({
      username,
      email,
      password,
    });

    const savedAdmin = await admin.save();
    res.status(201).json({ 
      id: savedAdmin._id, 
      username: savedAdmin.username, 
      email: savedAdmin.email 
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Admin with this username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;

