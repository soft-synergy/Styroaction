import express, { Request, Response } from 'express';
import PriceModel from '../models/Price';

const router = express.Router();

// Get all prices
router.get('/', async (req: Request, res: Response) => {
  try {
    const { producer, styrofoamType } = req.query;
    const query: any = {};

    if (producer) query.producer = producer;
    if (styrofoamType) query.styrofoamType = styrofoamType;

    // Only get active prices (validTo is null or in the future)
    query.$or = [
      { validTo: null },
      { validTo: { $gte: new Date() } }
    ];

    const prices = await PriceModel.find(query)
      .populate('producer')
      .populate('styrofoamType')
      .sort({ price: 1 });
    
    res.json(prices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get prices for a specific styrofoam type (for user requests)
router.get('/by-type/:styrofoamTypeId', async (req: Request, res: Response) => {
  try {
    const { styrofoamTypeId } = req.params;
    const now = new Date();

    const prices = await PriceModel.find({
      styrofoamType: styrofoamTypeId,
      validFrom: { $lte: now },
      $or: [
        { validTo: null },
        { validTo: { $gte: now } }
      ],
    })
      .populate('producer')
      .populate('styrofoamType')
      .sort({ price: 1 });
    
    res.json(prices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single price
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const price = await PriceModel.findById(req.params.id)
      .populate('producer')
      .populate('styrofoamType');
    
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }

    res.json(price);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create price
router.post('/', async (req: Request, res: Response) => {
  try {
    const { producer, styrofoamType, price, unit, currency, validFrom, validTo, notes } = req.body;

    if (!producer || !styrofoamType || price === undefined) {
      return res.status(400).json({ error: 'Producer, styrofoamType, and price are required' });
    }

    const newPrice = new PriceModel({
      producer,
      styrofoamType,
      price,
      unit: unit || 'm2',
      currency: currency || 'PLN',
      validFrom: validFrom || new Date(),
      validTo,
      notes,
    });

    const savedPrice = await newPrice.save();
    await savedPrice.populate('producer');
    await savedPrice.populate('styrofoamType');

    res.status(201).json(savedPrice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update price
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { producer, styrofoamType, price, unit, currency, validFrom, validTo, notes } = req.body;
    const updatedPrice = await PriceModel.findByIdAndUpdate(
      req.params.id,
      { producer, styrofoamType, price, unit, currency, validFrom, validTo, notes },
      { new: true, runValidators: true }
    )
      .populate('producer')
      .populate('styrofoamType');

    if (!updatedPrice) {
      return res.status(404).json({ error: 'Price not found' });
    }

    res.json(updatedPrice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete price
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const price = await PriceModel.findByIdAndDelete(req.params.id);

    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }

    res.json({ message: 'Price deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

