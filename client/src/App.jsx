import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import {
  getConversations,
  getConversation,
  deleteConversation,
  renameConversation,
  clearAllConversations
} from "./api";

function App() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Load sidebar history
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Could not load chat history:", error);
      }
    };

    loadConversations();
  }, []);

  // Start a new conversation
  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setLoadingChat(false);
  };

  // Called when first message creates a conversation
  const handleConversationCreated = (id, firstMessage) => {
    setConversationId(id);

    setConversations((previous) => {
      const existing = previous.some((conversation) => conversation._id === id);

      if (existing) return previous;

      return [
        {
          _id: id,
          title: firstMessage.slice(0, 45),
          preview: firstMessage.slice(0, 70),
          updatedAt: new Date().toISOString()
        },
        ...previous
      ];
    });
  };

  // Open an existing conversation
  const selectChat = async (conversation) => {
    try {
      setLoadingChat(true);
      setConversationId(conversation._id);
      setMessages([]);

      const data = await getConversation(conversation._id);

      setMessages(
        (data.messages || []).map((message) => ({
          role: message.role,
          content: message.content,
          sources: message.sources || [],
          memoryStats: message.memoryStats || null,
          createdAt: message.createdAt
        }))
      );
    } catch (error) {
      console.error("Could not load selected chat:", error);
    } finally {
      setLoadingChat(false);
    }
  };

  // Delete a conversation (resilient to backend support)
  const handleDeleteChat = async (id) => {
    try {
      await deleteConversation(id);
    } catch (error) {
      console.warn("Backend delete endpoint not active, updating client locally:", error);
    } finally {
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (conversationId === id) {
        newChat();
      }
    }
  };

  // Rename a conversation (resilient to backend support)
  const handleRenameChat = async (id, newTitle) => {
    try {
      await renameConversation(id, newTitle);
    } catch (error) {
      console.warn("Backend rename endpoint not active, updating client locally:", error);
    } finally {
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: newTitle } : c))
      );
    }
  };

  // Clear all conversations
  const handleClearAllChats = async () => {
    try {
      await clearAllConversations();
    } catch (error) {
      console.warn("Backend clear endpoint not active, clearing client locally:", error);
    } finally {
      setConversations([]);
      newChat();
    }
  };

  return (
    <div className="app min-h-screen bg-[#f8fafc]">
      <Chat
        conversationId={conversationId}
        onConversationCreated={handleConversationCreated}
        messages={messages}
        setMessages={setMessages}
        loadingChat={loadingChat}
        conversations={conversations}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onClearAllChats={handleClearAllChats}
      />
    </div>
  );
}

export default App;
