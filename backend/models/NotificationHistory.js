import mongoose from 'mongoose';

const notificationHistorySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
    },
    registerNumber: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['late', 'absent'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['delivered', 'failed'],
      default: 'delivered',
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationHistorySchema.index({ date: 1 });
notificationHistorySchema.index({ registerNumber: 1 });
notificationHistorySchema.index({ deliveryStatus: 1 });

const NotificationHistory = mongoose.model('NotificationHistory', notificationHistorySchema);
export default NotificationHistory;
