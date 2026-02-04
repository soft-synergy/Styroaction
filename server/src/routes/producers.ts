import express, { Request, Response } from 'express';
import ProducerModel from '../models/Producer';

const router = express.Router();

// Get all producers
router.get('/', async (req: Request, res: Response) => {
  try {
    const producers = await ProducerModel.find().sort({ name: 1 });
    res.json(producers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single producer
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const producer = await ProducerModel.findById(req.params.id);
    
    if (!producer) {
      return res.status(404).json({ error: 'Producer not found' });
    }

    res.json(producer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create producer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    const producer = new ProducerModel({
      name,
      email,
      phone,
      address,
    });

    const savedProducer = await producer.save();
    res.status(201).json(savedProducer);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Producer with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update producer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;
    const producer = await ProducerModel.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!producer) {
      return res.status(404).json({ error: 'Producer not found' });
    }

    res.json(producer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete producer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const producer = await ProducerModel.findByIdAndDelete(req.params.id);

    if (!producer) {
      return res.status(404).json({ error: 'Producer not found' });
    }

    res.json({ message: 'Producer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

