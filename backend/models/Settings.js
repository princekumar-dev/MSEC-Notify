import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      default: 'Meenakshi Sundararajan Engineering College',
    },
    teacherName: {
      type: String,
      default: '',
    },
    messageDelayMin: {
      type: Number,
      default: 4000,
      min: 2000,
      max: 10000,
    },
    messageDelayMax: {
      type: Number,
      default: 6000,
      min: 3000,
      max: 15000,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
