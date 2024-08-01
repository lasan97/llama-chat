import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  text: string;
  isUser: boolean;
  images?: string[];
}

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, messagesEndRef }) => {
  return (
    <div className="messages-container">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.isUser ? 'user' : 'ai'}`}>
          {message.isUser ? (
            <>
              {message.text}
              {message.images && message.images.map((image, idx) => (
                <img key={idx} src={image} alt="User upload" className="uploaded-image user-image" />
              ))}
            </>
          ) : (
            <ReactMarkdown
              children={message.text}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      children={String(children).replace(/\n$/, '')}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};