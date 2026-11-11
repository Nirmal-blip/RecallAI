
import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },

  sourceMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },

  role: {
    type: String,
    enum: ["user"],
    default: "user"
  },

  content: {
    type: String,
    required: true
  },

  embedding: {
    type: [Number],
    required: true
  },

  createdAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

memorySchema.index({ conversationId: 1, createdAt: -1 });

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;
