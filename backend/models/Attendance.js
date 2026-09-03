import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      default: 'present',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ date: 1 });
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
