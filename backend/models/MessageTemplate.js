import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['late', 'absent'],
      required: true,
      unique: true,
    },
    template: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);
export default MessageTemplate;
