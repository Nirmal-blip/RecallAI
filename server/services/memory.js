
import Conversation from "../models/Conversation.js";
import Memory from "../models/Memory.js";
import { pipeline } from "@huggingface/transformers";

// ==========================================
// SEMANTIC MODEL
// ==========================================

let extractorPromise = null;

const getExtractor = async () => {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      "onnx-community/all-MiniLM-L6-v2-ONNX"
    );
  }

  try {
    return await extractorPromise;
  } catch (error) {
    extractorPromise = null;
    throw error;
  }
};

const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Valid text is required");
  }

  const extractor = await getExtractor();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true
  });

  const embedding = output.tolist()[0];

  if (embedding.length !== 384) {
    throw new Error("Invalid embedding dimensions");
  }

  return embedding;
};


// ==========================================
// SHORT-TERM MEMORY
// ==========================================

export const saveMessage = async (conversationId, role, content) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  conversation.messages.push({
    role,
    content,
    createdAt: new Date()
  });

  await conversation.save();

  // Store semantic memory only for user messages
  if (role === "user") {
    const savedMessage =
      conversation.messages[conversation.messages.length - 1];

    try {
      const embedding = await generateEmbedding(content);

      await Memory.updateOne(
        { sourceMessageId: savedMessage._id },
        {
          $setOnInsert: {
            conversationId,
            sourceMessageId: savedMessage._id,
            role: "user",
            content,
            embedding,
            createdAt: savedMessage.createdAt
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error(
        "Semantic memory storage failed:",
        error.message
      );
    }
  }

  return conversation;
};

export const getMemory = async (conversationId, limit = 12) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) return [];

  return conversation.messages.slice(-limit).map((message) => ({
    role: message.role,
    content: message.content,
    createdAt: message.createdAt
  }));
};

export const getConversationHistory = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) return [];

  return conversation.messages.map((message) => ({
    role: message.role,
    content: message.content,
    createdAt: message.createdAt
  }));
};


// ==========================================
// DATE HELPERS - INDIA TIMEZONE
// ==========================================

const INDIA_OFFSET_MINUTES = 330;

const getIndiaDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  });

  return values;
};

const getIndiaDayStart = (dayOffset = 0) => {
  const { year, month, day } = getIndiaDateParts();

  const date = new Date(
    Date.UTC(year, month - 1, day + dayOffset)
  );

  return new Date(
    date.getTime() - INDIA_OFFSET_MINUTES * 60 * 1000
  );
};

const formatIndiaDate = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  });
};


// ==========================================
// EPISODIC MEMORY
// ==========================================

export const getEpisodicMemories = async (query) => {
  const text = query.toLowerCase();

  let startDate = null;
  let endDate = null;
  let mode = null;

  if (
    text.includes("first question") ||
    text.includes("first thing i asked") ||
    text.includes("what did i ask initially")
  ) {
    mode = "first_question";
  }

  else if (/\byesterday\b/.test(text)) {
    mode = "date_range";
    startDate = getIndiaDayStart(-1);
    endDate = getIndiaDayStart(0);
  }

  else if (/\btoday\b/.test(text)) {
    mode = "date_range";
    startDate = getIndiaDayStart(0);
    endDate = new Date();
  }

  else if (
    /last\s+7\s+days/.test(text) ||
    /\blast\s+week\b/.test(text)
  ) {
    mode = "date_range";
    startDate = getIndiaDayStart(-7);
    endDate = new Date();
  }

  else if (
    /when did i mention|when did i talk about|when was .* mentioned|when did we discuss|when did i discuss/.test(text)
  ) {
    mode = "keyword_search";
  }

  if (!mode) return [];

  const basePipeline = [
    { $unwind: "$messages" },
    {
      $match: {
        "messages.role": "user",
        "messages.createdAt": { $exists: true }
      }
    },
    {
      $project: {
        _id: 0,
        content: "$messages.content",
        createdAt: "$messages.createdAt",
        conversationId: "$_id"
      }
    }
  ];

  let results = [];

  if (mode === "first_question") {
    results = await Conversation.aggregate([
      ...basePipeline,
      { $sort: { createdAt: 1, createdAt: 1 } },
      { $limit: 1 }
    ]);
  }

  if (mode === "date_range") {
    results = await Conversation.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.role": "user",
          "messages.createdAt": {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $project: {
          _id: 0,
          content: "$messages.content",
          createdAt: "$messages.createdAt",
          conversationId: "$_id"
        }
      },
      { $sort: { createdAt: 1 } },
      { $limit: 5 }
    ]);
  }

  if (mode === "keyword_search") {
    const ignoredWords = new Set([
      "when", "did", "mention", "mentioned", "talk",
      "about", "discuss", "discussed", "was", "the",
      "what", "where", "which", "have", "has", "had",
      "you", "your", "i", "me", "we", "my", "last"
    ]);

    const keywords = [
      ...new Set(text.match(/[a-z0-9]+/g) || [])
    ].filter((word) => word.length > 2 && !ignoredWords.has(word));

    if (!keywords.length) return [];

    const expressions = keywords.map(
      (word) => new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      )
    );

    results = await Conversation.aggregate([
      ...basePipeline,
      {
        $match: {
          $or: expressions.map((regex) => ({
            content: { $regex: regex }
          }))
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ]);
  }

  return results.map((memory) => ({
    ...memory,
    formattedDate: formatIndiaDate(memory.createdAt)
  }));
};


// ==========================================
// LONG-TERM KEYWORD MEMORY
// ==========================================

export const searchRelevantMemories = async (
  query,
  currentConversationId = null,
  limit = 8
) => {
  const stopWords = new Set([
    "what", "when", "where", "which", "who", "why",
    "how", "was", "were", "the", "and", "for", "with",
    "that", "this", "have", "has", "had", "did", "does",
    "are", "you", "your", "my", "me", "about", "tell",
    "remember", "please", "can", "could", "from"
  ]);

  const keywords = [
    ...new Set(query.toLowerCase().match(/[a-z0-9]+/g) || [])
  ].filter((word) => word.length > 2 && !stopWords.has(word));

  if (!keywords.length) return [];

  const filter = {};

  if (currentConversationId) {
    filter._id = { $ne: currentConversationId };
  }

  const conversations = await Conversation.find(filter)
    .select("messages createdAt")
    .lean();

  const results = [];

  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (!message.content || message.role !== "user") continue;

      const content = message.content.toLowerCase();

      const matchedKeywords = keywords.filter((keyword) =>
        content.includes(keyword)
      );

      if (!matchedKeywords.length) continue;

      results.push({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        conversationId: conversation._id,
        score: matchedKeywords.length / keywords.length
      });
    }
  }

  return results
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, limit)
    .map(({ score, ...memory }) => ({
      ...memory,
      formattedDate: formatIndiaDate(memory.createdAt)
    }));
};


// ==========================================
// SEMANTIC MEMORY SEARCH
// ==========================================

export const searchSemanticMemories = async (
  query,
  currentConversationId = null,
  limit = 5
) => {
  if (!query?.trim()) return [];

  const queryEmbedding = await generateEmbedding(query);

  const results = await Memory.aggregate([
    {
      $vectorSearch: {
        index: "memory_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: Math.min(limit * 3, 30),
        filter: { role: "user" }
      }
    },
    {
      $addFields: {
        score: { $meta: "vectorSearchScore" }
      }
    },
    {
      $match: {
        score: { $gte: 0.35 }
      }
    },
    {
      $project: {
        conversationId: 1,
        content: 1,
        role: 1,
        createdAt: 1,
        score: 1
      }
    },
    { $sort: { score: -1 } }
  ]);

  return results
    .filter((memory) =>
      !currentConversationId ||
      memory.conversationId.toString() !==
        currentConversationId.toString()
    )
    .slice(0, limit)
    .map((memory) => ({
      ...memory,
      formattedDate: formatIndiaDate(memory.createdAt)
    }));
};


// ==========================================
// BACKFILL OLD CONVERSATIONS
// ==========================================

export const backfillSemanticMemories = async () => {
  const conversations = await Conversation.find({});

  let processed = 0;
  let skipped = 0;

  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (message.role !== "user" || !message.content?.trim()) {
        continue;
      }

      if (!message._id) {
        skipped++;
        continue;
      }

      const exists = await Memory.exists({
        sourceMessageId: message._id
      });

      if (exists) {
        skipped++;
        continue;
      }

      try {
        const embedding = await generateEmbedding(message.content);

        await Memory.create({
          conversationId: conversation._id,
          sourceMessageId: message._id,
          role: "user",
          content: message.content,
          embedding,
          createdAt: message.createdAt || conversation.createdAt
        });

        processed++;
        console.log("Backfilled:", processed);
      } catch (error) {
        console.error("Backfill error:", error.message);
      }
    }
  }

  console.log("Backfill completed!");
  console.log("Processed:", processed);
  console.log("Skipped:", skipped);
};
