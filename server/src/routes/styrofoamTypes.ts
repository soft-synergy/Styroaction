import express, { Request, Response } from 'express';
import StyrofoamTypeModel from '../models/StyrofoamType';

const router = express.Router();

// Get all styrofoam types
router.get('/', async (req: Request, res: Response) => {
  try {
    const types = await StyrofoamTypeModel.find().sort({ name: 1 });
    res.json(types);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single styrofoam type
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const type = await StyrofoamTypeModel.findById(req.params.id);
    
    if (!type) {
      return res.status(404).json({ error: 'Styrofoam type not found' });
    }

    res.json(type);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create styrofoam type
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, thickness, density, useCases } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const type = new StyrofoamTypeModel({
      name,
      description,
      thickness,
      density,
      useCases: Array.isArray(useCases) ? useCases : [],
    });

    const savedType = await type.save();
    res.status(201).json(savedType);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Styrofoam type with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update styrofoam type
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, thickness, density, useCases } = req.body;
    const type = await StyrofoamTypeModel.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description, 
        thickness, 
        density,
        useCases: Array.isArray(useCases) ? useCases : [],
      },
      { new: true, runValidators: true }
    );

    if (!type) {
      return res.status(404).json({ error: 'Styrofoam type not found' });
    }

    res.json(type);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete styrofoam type
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const type = await StyrofoamTypeModel.findByIdAndDelete(req.params.id);

    if (!type) {
      return res.status(404).json({ error: 'Styrofoam type not found' });
    }

    res.json({ message: 'Styrofoam type deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

