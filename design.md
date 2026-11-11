# RecallAI — System Design

## 1. Overview

RecallAI is an AI-powered personal chat assistant designed to provide accurate answers, search the web for current information, and remember previous user conversations.

Unlike a conventional chatbot, RecallAI maintains multiple forms of memory so that users can ask questions about their previous discussions and retrieve relevant information with timestamps.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| LLM | Groq — `openai/gpt-oss-120b` |
| Embeddings | Hugging Face Transformers.js |
| Embedding Model | all-MiniLM-L6-v2 ONNX |
| Semantic Retrieval | MongoDB Atlas Vector Search |
| Web Search | Tavily API |

## 3. System Architecture

The application follows a client-server architecture.

1. React frontend sends user messages to the Express backend.
2. The backend identifies the current conversation and saves the message.
3. The memory subsystem retrieves relevant historical information.
4. Semantic retrieval generates an embedding for the query and searches MongoDB Atlas Vector Search.
5. Keyword and episodic retrieval provide complementary memory results.
6. The backend passes the conversation history and retrieved memories to Groq.
7. If external information is required, the LLM invokes the web search tool.
8. The final response is returned to the frontend and saved in the conversation.

## 4. Memory Architecture

RecallAI uses four memory mechanisms.

### 4.1 Short-Term Memory

Stores recent messages from the active conversation.

Purpose:
- Maintain conversational context.
- Understand follow-up questions.
- Avoid repeatedly asking for information already shared in the current chat.

### 4.2 Long-Term Keyword Memory

Searches previous conversations using relevant keywords.

Purpose:
- Retrieve previously discussed topics.
- Find exact references to technologies, projects, and user information.

### 4.3 Semantic Memory

Semantic memory converts user messages into numerical embeddings using the all-MiniLM-L6-v2 model.

The embeddings are stored in MongoDB in a separate Memory collection.

When a new question arrives:
1. Generate an embedding for the query.
2. Perform vector similarity search.
3. Retrieve semantically related historical messages.
4. Pass relevant results to the LLM.

This allows RecallAI to retrieve information even when the wording of a new question differs from the original conversation.

### 4.4 Episodic Memory

Episodic memory focuses on what the user asked and when.

It supports retrieval based on:
- First questions.
- Today's discussions.
- Yesterday's discussions.
- Recent weekly history.
- Topic-specific mentions.

Timestamps are formatted using the Asia/Kolkata timezone.

## 5. Web Search Tool

RecallAI integrates Tavily as its external web search tool.

The LLM can invoke the web search function when a question requires current external information.

The backend:
1. Receives the search query.
2. Calls Tavily.
3. Returns search results to the LLM.
4. Uses the retrieved information to construct the final answer.

The assistant should provide source URLs when using web search results.

## 6. Data Storage

### Conversation Collection

Stores:
- Conversation ID.
- Messages.
- Message roles.
- Message content.
- Message timestamps.

### Memory Collection

Stores:
- Conversation ID.
- Original message ID.
- User message content.
- Embedding vector.
- Creation timestamp.

Separating embeddings from conversation documents allows vector retrieval without storing vectors inside every conversation message.

## 7. Performance and Reliability

The system is designed with the following considerations:

- Reuse the embedding model instead of loading it for every request.
- Limit conversation history sent to the LLM.
- Limit the number of retrieved memories.
- Avoid generating duplicate memory records.
- Use vector indexing for semantic retrieval.
- Keep web search optional and invoke it when needed.
- Handle memory retrieval failures gracefully so that temporary retrieval problems do not unnecessarily prevent ordinary chat responses.

## 8. Future Improvements

- Better memory ranking and relevance thresholds.
- Memory summarization and user profile extraction.
- Improved natural-language date interpretation.
- Memory deduplication and consolidation.
- Streaming responses for lower perceived latency.
- Automated evaluation of memory retrieval accuracy.
- More robust error handling and observability.

## 9. Design Goal

RecallAI aims to provide a conversational experience that combines the speed of an AI assistant, the information retrieval capabilities of web search, and the continuity of persistent personal memory.