import express, { Request, Response } from 'express';
import PriceListRequestModel from '../models/PriceListRequest';
import { sendPriceListRequestEmail } from '../services/emailService';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/price-lists/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.oasis.opendocument.spreadsheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nieobsługiwany typ pliku. Dozwolone: PDF, Excel, CSV'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'price-lists');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all price list requests (admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requests = await PriceListRequestModel.find()
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single price list request
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const request = await PriceListRequestModel.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create price list request (initialize)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, producerName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if request already exists
    let request = await PriceListRequestModel.findOne({ email });

    if (!request) {
      // Generate tokens
      const uploadToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      request = new PriceListRequestModel({
        email,
        producerName,
        status: 'pending',
        followUpCount: 0,
        uploadToken,
        unsubscribeToken,
      });

      await request.save();
    }

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload price list file (public endpoint with token)
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Find request by email
    const request = await PriceListRequestModel.findOne({ email: email as string });

    if (!request) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Request not found' });
    }

    // Verify token matches (simple check - in production use proper token verification)
    if (request.uploadToken && request.uploadToken !== token) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Update request with file info
    const fileUrl = `/uploads/price-lists/${req.file.filename}`;
    request.uploadedFileUrl = fileUrl;
    request.uploadedFileName = req.file.originalname;
    request.status = 'responded';
    request.respondedAt = new Date();
    await request.save();

    res.json({
      message: 'Plik został przesłany pomyślnie',
      request: request,
    });
  } catch (error: any) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Verify upload token (for frontend)
router.get('/verify-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const request = await PriceListRequestModel.findOne({ 
      email: email as string,
      uploadToken: token,
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found or invalid token' });
    }

    res.json({ valid: true, request });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manually send request email (admin)
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const request = await PriceListRequestModel.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.unsubscribed) {
      return res.status(400).json({ error: 'This email has been unsubscribed' });
    }

    const uploadToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeToken = request.unsubscribeToken || crypto.randomBytes(32).toString('hex');
    const isFollowUp = request.followUpCount > 0;

    const success = await sendPriceListRequestEmail(
      request.email,
      request.producerName,
      uploadToken,
      isFollowUp,
      request.followUpCount,
      unsubscribeToken
    );

    if (success) {
      request.status = 'sent';
      request.lastSentAt = new Date();
      request.followUpCount += 1;
      request.uploadToken = uploadToken; // Store token for verification
      request.unsubscribeToken = unsubscribeToken; // Store unsubscribe token

      // Set next follow-up date (7 days from now)
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      request.nextFollowUpAt = nextDate;

      await request.save();
    }

    res.json({ success, request });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset request status (admin)
router.post('/:id/reset', async (req: Request, res: Response) => {
  try {
    const request = await PriceListRequestModel.findByIdAndUpdate(
      req.params.id,
      {
        status: 'pending',
        followUpCount: 0,
        lastSentAt: null,
        nextFollowUpAt: null,
        respondedAt: null,
        uploadedFileUrl: null,
        uploadedFileName: null,
        uploadToken: null,
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe endpoint (public)
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    const request = await PriceListRequestModel.findOne({ 
      email: email as string,
      unsubscribeToken: token,
    });

    if (!request) {
      return res.status(404).json({ error: 'Invalid unsubscribe link' });
    }

    if (request.unsubscribed) {
      return res.json({ 
        message: 'Ten adres email został już wypisany z listy',
        alreadyUnsubscribed: true 
      });
    }

    request.unsubscribed = true;
    request.unsubscribedAt = new Date();
    await request.save();

    res.json({ 
      message: 'Zostałeś wypisany z listy. Nie będziesz już otrzymywać wiadomości o cennikach.',
      success: true 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify unsubscribe token (for frontend)
router.get('/verify-unsubscribe/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const request = await PriceListRequestModel.findOne({ 
      email: email as string,
      unsubscribeToken: token,
    });

    if (!request) {
      return res.status(404).json({ error: 'Invalid unsubscribe link' });
    }

    res.json({ valid: true, alreadyUnsubscribed: request.unsubscribed || false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
