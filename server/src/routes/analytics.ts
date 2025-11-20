import express, { Request, Response } from 'express';
import { PipelineStage } from 'mongoose';
import AnalyticsEvent from '../models/AnalyticsEvent';

const router = express.Router();

const blockedIpSet = new Set(
  (process.env.ANALYTICS_BLOCKED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
);

const normalizeIp = (ip?: string | null) => {
  if (!ip) return null;
  return ip.replace(/^::ffff:/, '').trim();
};

const getClientIp = (req: Request): string | null => {
  const header = req.headers['x-forwarded-for'];
  if (typeof header === 'string' && header.length > 0) {
    const [first] = header.split(',');
    return normalizeIp(first);
  }
  if (Array.isArray(header) && header.length > 0) {
    return normalizeIp(header[0]);
  }
  return normalizeIp(req.socket.remoteAddress || req.ip);
};

// Log analytics event
router.post('/event', async (req: Request, res: Response) => {
  try {
    const { eventType, variant, metadata } = req.body;

    if (!eventType || !variant) {
      return res.status(400).json({ error: 'eventType and variant are required' });
    }

    const clientIp = getClientIp(req);
    if (clientIp && blockedIpSet.has(clientIp)) {
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: 'ip_blocked',
      });
    }

    const payload: Record<string, any> = { eventType, variant, metadata };

    if (clientIp) {
      payload.metadata = {
        ...(metadata || {}),
        clientIp,
      };
    }

    const event = await AnalyticsEvent.create(payload);
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

    const pipeline: PipelineStage[] = [];
    if (Object.keys(match).length) {
      pipeline.push({ $match: match } as PipelineStage);
    }

    pipeline.push(
      {
        $group: {
          _id: { variant: '$variant', eventType: '$eventType' },
          count: { $sum: 1 },
        },
      } as PipelineStage,
      {
        $group: {
          _id: '$_id.variant',
          events: { $push: { eventType: '$_id.eventType', count: '$count' } },
          total: { $sum: '$count' },
        },
      } as PipelineStage,
      { $sort: { _id: 1 } } as PipelineStage
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
