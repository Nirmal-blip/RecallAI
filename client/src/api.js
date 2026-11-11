import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Send a message with optional signal for cancellation and webSearch toggle
export const sendMessage = async (
  message,
  conversationId = null,
  signal = null,
  webSearchEnabled = true
) => {
  const response = await API.post(
    "/chat",
    {
      message,
      conversationId,
      webSearchEnabled
    },
    { signal }
  );

  return response.data;
};

// Fetch all conversations
export const getConversations = async () => {
  const response = await API.get("/chat/conversations");
  return response.data;
};

// Fetch a specific conversation
export const getConversation = async (conversationId) => {
  const response = await API.get(`/chat/${conversationId}`);
  return response.data;
};

// Delete a specific conversation
export const deleteConversation = async (conversationId) => {
  const response = await API.delete(`/chat/${conversationId}`);
  return response.data;
};

// Rename a conversation
export const renameConversation = async (conversationId, title) => {
  const response = await API.patch(`/chat/${conversationId}`, { title });
  return response.data;
};

// Clear all conversations
export const clearAllConversations = async () => {
  const response = await API.delete("/chat");
  return response.data;
};

export default API;
