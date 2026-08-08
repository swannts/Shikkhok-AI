describe('SSE Parser and Stream Termination Contract Tests', () => {
  function parseSseStream(chunks: string[]): { deltas: string[]; fullText: string } {
    const deltas: string[] = [];
    let fullText = '';
    let buffer = '';
    let isStreamCompleted = false;

    for (const chunk of chunks) {
      if (isStreamCompleted) break;
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.slice(5).trim();
          if (dataContent === '[DONE]') {
            isStreamCompleted = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataContent);
            const deltaText = parsed.text || parsed.delta || parsed.content || '';
            if (deltaText) {
              deltas.push(deltaText);
              fullText += deltaText;
            }
          } catch {
            deltas.push(dataContent);
            fullText += dataContent;
          }
        }
      }
    }

    if (!isStreamCompleted && buffer.trim()) {
      fullText += buffer.trim();
      deltas.push(buffer.trim());
    }

    return { deltas, fullText };
  }

  test('correctly parses single event data line', () => {
    const result = parseSseStream(['data: {"text": "চলো"}\n\n']);
    expect(result.deltas).toEqual(['চলো']);
    expect(result.fullText).toBe('চলো');
  });

  test('correctly terminates stream on [DONE] event', () => {
    const chunks = ['data: {"text": "উত্তর"}\n', 'data: [DONE]\n', 'data: {"text": "ignored"}\n'];
    const result = parseSseStream(chunks);
    expect(result.deltas).toEqual(['উত্তর']);
    expect(result.fullText).toBe('উত্তর');
  });

  test('flushes trailing un-newline buffer content on stream end', () => {
    const chunks = ['data: {"text": "শেষ"}\n', 'অবশিষ্টাংশ'];
    const result = parseSseStream(chunks);
    expect(result.deltas).toEqual(['শেষ', 'অবশিষ্টাংশ']);
    expect(result.fullText).toBe('শেষঅবশিষ্টাংশ');
  });
});
