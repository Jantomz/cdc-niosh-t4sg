import React from 'react';
import { Message, SourceReference } from '../../types/chat';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  onSourceClick: (source: SourceReference) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSourceClick }) => {
  const isUser = message.role === 'user';
  
  // Format timestamp
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp);
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`rounded-lg p-3 max-w-3xl ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="prose max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        
        {/* Source references section */}
        {!isUser && message.sourceReferences && message.sourceReferences.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Sources:</p>
            <div className="flex flex-wrap gap-1">
              {message.sourceReferences.map((source) => (
                <button
                  key={source.id}
                  onClick={() => onSourceClick(source)}
                  className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center"
                >
                  {/* Icon based on source type */}
                  {source.type === 'image' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {source.type === 'code' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )}
                  {source.type === 'chart' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {source.type === 'text' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {source.title || 'Source'}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs mt-1 text-right opacity-70">
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
