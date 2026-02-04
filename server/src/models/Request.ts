import mongoose, { Document, Schema } from 'mongoose';

export interface IGuidedItem {
  useCase: string;
  styrofoamType?: mongoose.Types.ObjectId;
  styrofoamName?: string;
  thicknessCm?: number;
  areaM2?: number;
  volumeM3?: number;
  notes?: string;
}

export interface IRequest extends Document {
  name: string;
  email: string;
  phone: string;
  company?: string;
  postalCode: string;
  styrofoamType?: mongoose.Types.ObjectId;
  quantity?: number;
  requestMode: 'guided' | 'manual';
  guidedItems?: IGuidedItem[];
  manualDetails?: string;
  needsConsultation?: boolean;
  totalVolumeM3?: number;
  notes?: string;
  status: 'pending' | 'processed' | 'sent';
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GuidedItemSchema = new Schema<IGuidedItem>(
  {
    useCase: {
      type: String,
      required: true,
    },
    styrofoamType: {
      type: Schema.Types.ObjectId,
      ref: 'StyrofoamType',
    },
    styrofoamName: {
      type: String,
    },
    thicknessCm: {
      type: Number,
    },
    areaM2: {
      type: Number,
    },
    volumeM3: {
      type: Number,
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const RequestSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
    },
    postalCode: {
      type: String,
      required: true,
    },
    styrofoamType: {
      type: Schema.Types.ObjectId,
      ref: 'StyrofoamType',
    },
    quantity: {
      type: Number,
    },
    requestMode: {
      type: String,
      enum: ['guided', 'manual'],
      default: 'guided',
    },
    guidedItems: {
      type: [GuidedItemSchema],
      default: undefined,
    },
    manualDetails: {
      type: String,
    },
    needsConsultation: {
      type: Boolean,
      default: false,
    },
    totalVolumeM3: {
      type: Number,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'sent'],
      default: 'pending',
    },
    emailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRequest>('Request', RequestSchema);

