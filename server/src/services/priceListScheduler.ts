import cron from 'node-cron';
import PriceListRequestModel from '../models/PriceListRequest';
import { sendPriceListRequestEmail } from './emailService';
import crypto from 'crypto';

const MAX_FOLLOW_UPS = 3;

// Send initial requests or follow-ups
export const sendScheduledPriceListRequests = async () => {
  try {
    const now = new Date();
    
    // Find requests that need to be sent:
    // 1. Pending requests that haven't been sent yet
    // 2. Sent requests that need follow-up (nextFollowUpAt <= now and followUpCount < MAX_FOLLOW_UPS)
    // Exclude unsubscribed emails
    const requestsToSend = await PriceListRequestModel.find({
      unsubscribed: { $ne: true },
      $or: [
        { status: 'pending', lastSentAt: null },
        {
          status: 'sent',
          nextFollowUpAt: { $lte: now },
          followUpCount: { $lt: MAX_FOLLOW_UPS },
        },
      ],
    });

    console.log(`Found ${requestsToSend.length} price list requests to send`);

    for (const request of requestsToSend) {
      try {
        // Skip if unsubscribed (double check)
        if (request.unsubscribed) {
          continue;
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

          // If max follow-ups reached, mark as expired
          if (request.followUpCount >= MAX_FOLLOW_UPS) {
            request.status = 'expired';
          }

          await request.save();
          console.log(`Sent price list request to ${request.email} (follow-up #${request.followUpCount})`);
        } else {
          console.error(`Failed to send price list request to ${request.email}`);
        }
      } catch (error) {
        console.error(`Error processing request for ${request.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in sendScheduledPriceListRequests:', error);
  }
};

// Initialize requests for all producers
export const initializePriceListRequests = async (emails: string[]) => {
  try {
    for (const email of emails) {
      // Check if request already exists
      const existing = await PriceListRequestModel.findOne({ email });
      
      if (!existing) {
        // Generate tokens
        const uploadToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        const request = new PriceListRequestModel({
          email,
          status: 'pending',
          followUpCount: 0,
          uploadToken,
          unsubscribeToken,
        });
        await request.save();
        console.log(`Initialized price list request for ${email}`);
      } else if (!existing.unsubscribeToken) {
        // Generate unsubscribe token for existing requests that don't have one
        existing.unsubscribeToken = crypto.randomBytes(32).toString('hex');
        await existing.save();
      }
    }
  } catch (error) {
    console.error('Error initializing price list requests:', error);
  }
};

// Start cron job - runs every Monday at 9:00 AM
export const startPriceListScheduler = () => {
  // Run every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running scheduled price list requests...');
    await sendScheduledPriceListRequests();
  });

  console.log('Price list scheduler started (runs every Monday at 9:00 AM)');
};
