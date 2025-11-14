import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  eventType: 'page_view' | 'open_modal' | 'submit_form';
  variant: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsEventSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['page_view', 'open_modal', 'submit_form'],
    },
    variant: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
