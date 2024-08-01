import React from 'react';

interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isDisabled: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelectModel, isDisabled }) => {
  return (
    <div className="model-selector">
      <label htmlFor="model-select">AI 모델 선택: </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onSelectModel(e.target.value)}
        disabled={isDisabled}
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
};