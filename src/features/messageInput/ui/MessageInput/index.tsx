import React, { useState, useRef } from 'react';

interface MessageInputProps {
  onSendMessage: (input: string, selectedImage: string | null) => void;
  isLoading: boolean;
  onStopResponse: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, onStopResponse }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(input, selectedImage);
    setInput('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      handleSubmit(e);
    }
  };

  return (
    <div className="input-container">
      {isLoading && (
        <button onClick={onStopResponse} className="stop-button">
          중지
        </button>
      )}
      <form onSubmit={handleSubmit} className="input-form">
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
  );
};