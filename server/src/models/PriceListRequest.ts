import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceListRequest extends Document {
  email: string;
  producerName?: string;
  status: 'pending' | 'sent' | 'responded' | 'expired';
  followUpCount: number;
  lastSentAt?: Date;
  nextFollowUpAt?: Date;
  respondedAt?: Date;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  uploadToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PriceListRequestSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    producerName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'responded', 'expired'],
      default: 'pending',
    },
    followUpCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
    },
    nextFollowUpAt: {
      type: Date,
    },
    respondedAt: {
      type: Date,
    },
    uploadedFileUrl: {
      type: String,
    },
    uploadedFileName: {
      type: String,
    },
    uploadToken: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPriceListRequest>('PriceListRequest', PriceListRequestSchema);
