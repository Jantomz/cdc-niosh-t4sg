import React, { useState, useRef, useEffect } from "react";
import ChatInput from "../components/ChatBot/ChatInput";
import ChatMessage from "../components/ChatBot/ChatMessage";
import SourcePanel from "../components/ChatBot/SourcePanel";
import LoadingIndicator from "../components/ChatBot/LoadingIndicator";
import { Message, RagResponse, SourceReference } from "../types/chat";
import { RagApi } from "../services/api";

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-welcome",
      role: "assistant",
      content: "Hello! I'm your Eng Wiki assistant. Ask me anything about our documentation, tech stack, or engineering practices.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSources, setCurrentSources] = useState<SourceReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backendURL = "http://localhost:3000";

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API endpoint for RAG query
      const response = await RagApi.queryRag({
        query: content,
        conversationContext: messages,
      });
      
      // Add assistant response to chat
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        sourceReferences: response.sourceReferences,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentSources(response.sourceReferences);
    } catch (err) {
      console.error("Error querying RAG system:", err);
      setError("Sorry, there was an error processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      {/* Chat section */}
      <div className="flex flex-col w-full md:w-2/3 h-full border-r">
        <div className="p-4 border-b bg-gray-50">
          <h1 className="text-2xl font-bold">Eng Wiki Assistant</h1>
          <p className="text-gray-600">Ask questions about our engineering documentation</p>
        </div>
        
        {/* Messages area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onSourceClick={(sourceRef) => setCurrentSources([sourceRef])}
            />
          ))}
          {isLoading && <LoadingIndicator />}
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="p-4 border-t">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
      
      {/* Source panel - shows context, images, etc. */}
      <div className="hidden md:block md:w-1/3 h-full overflow-y-auto">
        <SourcePanel sources={currentSources} />
      </div>
    </div>
  );
};

export default ChatBot;
