import mongoose from "mongoose";
import { uuidv7 } from "uuidv7";

const profileSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv7(),
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
      index: true,
    },
    gender_probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
      index: true,
    },
    age_group: {
      type: String,
      enum: ["child", "teenager", "adult", "senior"],
      required: true,
      index: true,
    },
    country_id: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
      index: true,
    },
    country_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    country_probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(doc, ret) {
        ret.created_at = ret.created_at.toISOString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound indexes for performance
profileSchema.index({ gender: 1, country_id: 1, age: 1 });
profileSchema.index({ age_group: 1, country_id: 1 });
profileSchema.index({ gender_probability: -1 });
profileSchema.index({ country_probability: -1 });

export default mongoose.model("Profile", profileSchema);