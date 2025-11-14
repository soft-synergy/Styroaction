import mongoose, { Document, Schema } from 'mongoose';

export interface IPrice extends Document {
  producer: mongoose.Types.ObjectId;
  styrofoamType: mongoose.Types.ObjectId;
  price: number;
  unit: string; // per m2, per m3, etc.
  currency: string; // PLN, EUR, etc.
  validFrom: Date;
  validTo?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PriceSchema: Schema = new Schema(
  {
    producer: {
      type: Schema.Types.ObjectId,
      ref: 'Producer',
      required: true,
    },
    styrofoamType: {
      type: Schema.Types.ObjectId,
      ref: 'StyrofoamType',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'm2',
    },
    currency: {
      type: String,
      default: 'PLN',
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validTo: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PriceSchema.index({ producer: 1, styrofoamType: 1 });

export default mongoose.model<IPrice>('Price', PriceSchema);

