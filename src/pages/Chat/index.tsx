import { useState, useRef, useEffect } from 'react';
import { sendMessageToLlama } from '../../shared/api/llamaApi';
import { MessageList } from '../../entities/message/ui/MessageList';
import { MessageInput } from '../../features/messageInput/ui/MessageInput';
import { ModelSelector } from '../../features/aiModelSelector/ui/AiModelSelector';
import './styles.css';

interface Message {
  text: string;
  isUser: boolean;
  images?: string[];
}

const models = ['llama:3.1', 'llava'];

export const Chat = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const handleSendMessage = async (input: string, selectedImage: string | null) => {
    if ((input.trim() === '' && !selectedImage) || isLoading) return;

    const newMessage: Message = { text: input, isUser: true, images: selectedImage ? [selectedImage] : undefined };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setIsLoading(true);

    const formattedMessages = [...messages, newMessage].map(message => ({
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <h1>AI Chat</h1>
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        isDisabled={isLoading}
      />
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStopResponse={handleStopResponse}
      />
      {isLoading && <div className="spinner">로딩 중...</div>}
    </div>
  );
}