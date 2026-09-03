import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    registerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentMobile: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      default: '1',
      trim: true,
    },
    department: {
      type: String,
      default: 'CSE',
      trim: true,
      uppercase: true,
    },
    section: {
      type: String,
      default: 'A',
      trim: true,
      uppercase: true,
    },
    classIncharge: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ studentName: 'text' });

const Student = mongoose.model('Student', studentSchema);
export default Student;
