
import express from "express";
import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Memory from "../models/Memory.js";
import generateAnswer from "../services/groq.js";

import {
  saveMessage,
  searchRelevantMemories,
  getEpisodicMemories,
  searchSemanticMemories
} from "../services/memory.js";

const router = express.Router();

// ==========================================
// GET ALL CONVERSATIONS
// ==========================================

router.get("/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .select("_id title messages createdAt updatedAt")
      .lean();

    const formattedConversations = conversations.map((chat) => {
      const firstUserMessage = chat.messages?.find(
        (message) => message.role === "user"
      );

      return {
        _id: chat._id,
        title:
          chat.title ||
          (firstUserMessage
            ? firstUserMessage.content.slice(0, 40)
            : "New Chat"),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    });

    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("FETCH CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch conversations"
    });
  }
});

// ==========================================
// GET PARTICULAR CONVERSATION
// ==========================================

router.get("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        error: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("FETCH CHAT ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch conversation"
    });
  }
});

// ==========================================
// POST MESSAGE
// ==========================================

router.post("/", async (req, res) => {
  try {
    const { message, conversationId } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    let conversation;

    // Find existing conversation
    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          error: "Invalid conversation ID"
        });
      }

      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found"
        });
      }
    }

    // Create new conversation
    if (!conversation) {
      conversation = await Conversation.create({
        messages: []
      });
    }

    // ======================================
    // SAVE USER MESSAGE + EMBEDDING
    // ======================================

    await saveMessage(
      conversation._id,
      "user",
      message.trim()
    );

    // Reload latest conversation
    conversation = await Conversation.findById(conversation._id);

    // ======================================
    // SHORT-TERM MEMORY
    // ======================================

    const history = conversation.messages
      .slice(-12)
      .map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

    // ======================================
    // LONG-TERM KEYWORD MEMORY
    // ======================================

    const memories = await searchRelevantMemories(
      message,
      conversation._id,
      3
    );

    // ======================================
    // EPISODIC MEMORY
    // ======================================

    const episodicMemories = await getEpisodicMemories(message);

    // ======================================
    // SEMANTIC MEMORY
    // ======================================

    const semanticMemories = await searchSemanticMemories(
      message,
      conversation._id,
      5
    );

    console.log("Keyword memories:", memories.length);
    console.log("Episodic memories:", episodicMemories.length);
    console.log("Semantic memories:", semanticMemories.length);

    // ======================================
    // GENERATE AI RESPONSE
    // ======================================

    const answer = await generateAnswer(
      history,
      memories,
      episodicMemories,
      semanticMemories
    );

    // ======================================
    // SAVE ASSISTANT RESPONSE
    // ======================================

    await saveMessage(
      conversation._id,
      "assistant",
      answer
    );

    return res.status(200).json({
      answer,
      conversationId: conversation._id,
      memoriesUsed: memories.length,
      episodicMemoriesUsed: episodicMemories.length,
      semanticMemoriesUsed: semanticMemories.length
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    return res.status(500).json({
      error: error.message || "Failed to process message"
    });
  }
});

// ==========================================
// RENAME CONVERSATION
// ==========================================

router.patch("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Title is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        error: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { title: title.trim() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    return res.status(200).json({
      success: true,
      title: conversation.title
    });
  } catch (error) {
    console.error("RENAME CONVERSATION ERROR:", error);
    return res.status(500).json({
      error: "Failed to rename conversation"
    });
  }
});

// ==========================================
// DELETE PARTICULAR CONVERSATION
// ==========================================

router.delete("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        error: "Invalid conversation ID"
      });
    }

    const conversation = await Conversation.findByIdAndDelete(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    // Clean up semantic memories associated with this conversation
    await Memory.deleteMany({ conversationId });

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    console.error("DELETE CONVERSATION ERROR:", error);
    return res.status(500).json({
      error: "Failed to delete conversation"
    });
  }
});

// ==========================================
// CLEAR ALL CONVERSATIONS
// ==========================================

router.delete("/", async (req, res) => {
  try {
    await Conversation.deleteMany({});
    await Memory.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "All conversations cleared successfully"
    });
  } catch (error) {
    console.error("CLEAR ALL CONVERSATIONS ERROR:", error);
    return res.status(500).json({
      error: "Failed to clear conversations"
    });
  }
});

export default router;
