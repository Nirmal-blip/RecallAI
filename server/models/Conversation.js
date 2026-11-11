import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

export default Conversation;