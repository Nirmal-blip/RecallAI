
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },

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
  },

  sources: [
    {
      title: String,
      url: String
    }
  ]
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
