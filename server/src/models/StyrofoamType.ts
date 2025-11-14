import mongoose, { Document, Schema } from 'mongoose';

export interface IStyrofoamType extends Document {
  name: string;
  description?: string;
  thickness?: string;
  density?: string;
  useCases?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StyrofoamTypeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    thickness: {
      type: String,
    },
    density: {
      type: String,
    },
    useCases: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IStyrofoamType>('StyrofoamType', StyrofoamTypeSchema);

