import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToLlama } from './llamaApi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './Chat.css';

interface Message {
  role: string;
  content: string;
  images?: string[];
}

const models = ['llama3.1', 'llava']; // 모델 리스트

export const Chat = (): JSX.Element => {
  const [messages, setMessages] = useState<Array<{ text: string, isUser: boolean, images?: string[] }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() === '' && !selectedImage) || isLoading) return;

    const newMessage = { text: input, isUser: true, images: selectedImage ? [selectedImage] : undefined };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);

    const formattedMessages: Message[] = [...messages, newMessage].map(message => ({
      role: message.isUser ? 'user' : 'assistant',
      content: message.text,
      images: message.images?.map(img => img.split(',')[1]),
    }));

    let fullResponse = '';
    const controller = new AbortController();
    setAbortController(controller);

    try {
      await sendMessageToLlama(
        selectedModel,
        formattedMessages,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const updatedMessages = [...prev];
            if (updatedMessages[updatedMessages.length - 1].isUser) {
              updatedMessages.push({ text: fullResponse, isUser: false });
            } else {
              updatedMessages[updatedMessages.length - 1].text = fullResponse;
            }
            return updatedMessages;
          });
        },
        (finalResponse) => {
          setMessages(prev => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1].text = finalResponse;
            return updatedMessages;
          });
          setIsLoading(false);
          setAbortController(null);
        },
        controller.signal
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Error sending message:', error);
        alert('메시지를 보내는 도중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <h1>AI Chat</h1>
      <div className="model-selector">
        <label htmlFor="model-select">AI 모델 선택: </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isLoading}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
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
      <div className="input-container">
        {isLoading && (
          <button onClick={handleStopResponse} className="stop-button">
            중지
          </button>
        )}
        <form onSubmit={handleSendMessage} className="input-form">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLoading}
            ref={fileInputRef}
          />
          {selectedImage && <img src={selectedImage} alt="Preview" className="uploaded-image preview-image" />}
          <button type="submit" disabled={isLoading}>
            {isLoading ? '전송 중...' : '전송'}
          </button>
        </form>
      </div>
      {isLoading && <div className="spinner">로딩 중...</div>}
    </div>
  );
}