import mongoose from 'mongoose';

const whatsappSessionSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      default: null,
    },
    profileName: {
      type: String,
      default: null,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    disconnectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const WhatsappSession = mongoose.model('WhatsappSession', whatsappSessionSchema);
export default WhatsappSession;
