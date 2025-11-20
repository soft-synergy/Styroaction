import express, { Request, Response } from 'express';
import RequestModel from '../models/Request';
import { sendPriceBreakdown, sendRequestConfirmationEmail } from '../services/emailService';

const router = express.Router();

// Create a new request
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      postalCode,
      styrofoamType,
      quantity,
      requestMode = 'guided',
      guidedItems,
      manualDetails,
      needsConsultation,
      totalVolumeM3,
      notes,
    } = req.body;

    if (!name || !email || !postalCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (requestMode === 'guided' && (!guidedItems || guidedItems.length === 0)) {
      return res.status(400).json({ error: 'Brak pozycji w zapytaniu' });
    }

    const newRequest = new RequestModel({
      name,
      email,
      phone,
      company,
      postalCode,
      styrofoamType,
      quantity,
      requestMode,
      guidedItems,
      manualDetails,
      needsConsultation,
      totalVolumeM3,
      notes,
    });

    const savedRequest = await newRequest.save();
    await savedRequest.populate([
      { path: 'styrofoamType' },
      { path: 'guidedItems.styrofoamType' },
    ]);

    // Send confirmation email (non-blocking for API response)
    sendRequestConfirmationEmail(savedRequest).catch((emailError) => {
      console.error('Failed to send confirmation email:', emailError);
    });

    res.status(201).json(savedRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all requests (admin only - should be protected)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requests = await RequestModel.find()
      .populate('styrofoamType')
      .populate('guidedItems.styrofoamType')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single request
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const request = await RequestModel.findById(req.params.id)
      .populate('styrofoamType')
      .populate('guidedItems.styrofoamType');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update request status
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status, emailSentAt } = req.body;
    const request = await RequestModel.findByIdAndUpdate(
      req.params.id,
      { status, emailSentAt },
      { new: true }
    ).populate('styrofoamType');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete request
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deletedRequest = await RequestModel.findByIdAndDelete(req.params.id);

    if (!deletedRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send price breakdown email
router.post('/:id/send-email', async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const success = await sendPriceBreakdown(requestId);

    if (success) {
      res.json({ message: 'Email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

