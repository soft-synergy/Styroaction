import mongoose, { Document, Schema } from 'mongoose';

export interface IProducer extends Document {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProducerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProducer>('Producer', ProducerSchema);

