interface LlamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface Message {
  role: string;
  content: string;
  images?: string[];
}

export const sendMessageToLlama = async (
  model: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  signal: AbortSignal
): Promise<void> => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() !== '') {
          try {
            const parsed: LlamaResponse = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              const newContent = parsed.message.content;
              fullResponse += newContent;
              onChunk(newContent);
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      }
    }

    onComplete(fullResponse);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted');
    } else {
      console.error('There was a problem with the fetch operation:', error);
    }
    throw error;
  }
};