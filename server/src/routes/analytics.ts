import express, { Request, Response } from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent';

const router = express.Router();

// Log analytics event
router.post('/event', async (req: Request, res: Response) => {
  try {
    const { eventType, variant, metadata } = req.body;

    if (!eventType || !variant) {
      return res.status(400).json({ error: 'eventType and variant are required' });
    }

    const event = await AnalyticsEvent.create({ eventType, variant, metadata });
    res.status(201).json({ success: true, eventId: event._id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary per variant
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    const match: Record<string, any> = {};
    if (from || to) {
      match.createdAt = {};
      if (from) {
        match.createdAt.$gte = new Date(from as string);
      }
      if (to) {
        match.createdAt.$lte = new Date(to as string);
      }
    }

    const pipeline: Record<string, any>[] = [];
    if (Object.keys(match).length) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      {
        $group: {
          _id: { variant: '$variant', eventType: '$eventType' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.variant',
          events: { $push: { eventType: '$_id.eventType', count: '$count' } },
          total: { $sum: '$count' },
        },
      },
      { $sort: { _id: 1 } }
    );

    const results = await AnalyticsEvent.aggregate(pipeline);

    const summary = results.map((item) => ({
      variant: item._id,
      total: item.total,
      events: item.events.reduce(
        (acc: Record<string, number>, ev: { eventType: string; count: number }) => {
          acc[ev.eventType] = ev.count;
          return acc;
        },
        {}
      ),
    }));

    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
