describe('SSE Parser Contract Tests', () => {
  function parseSseBuffer(buffer: string): { deltas: string[]; fullText: string } {
    const deltas: string[] = [];
    let fullText = '';
    const lines = buffer.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;

      if (trimmed.startsWith('data:')) {
        const dataContent = trimmed.slice(5).trim();
        if (dataContent === '[DONE]') continue;

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

    return { deltas, fullText };
  }

  test('correctly parses single event data line', () => {
    const ssePayload = 'data: {"text": "চলো"}\n\n';
    const result = parseSseBuffer(ssePayload);
    expect(result.deltas).toEqual(['চলো']);
    expect(result.fullText).toBe('চলো');
  });

  test('correctly parses multiple data lines in single chunk', () => {
    const ssePayload =
      'data: {"text": "চলো"}\ndata: {"text": " ধাপে"}\ndata: {"text": " ধাপে"}\n\n';
    const result = parseSseBuffer(ssePayload);
    expect(result.deltas).toEqual(['চলো', ' ধাপে', ' ধাপে']);
    expect(result.fullText).toBe('চলো ধাপে ধাপে');
  });

  test('ignores [DONE] streaming completion signal', () => {
    const ssePayload = 'data: {"text": "সমাধান"}\ndata: [DONE]\n\n';
    const result = parseSseBuffer(ssePayload);
    expect(result.deltas).toEqual(['সমাধান']);
    expect(result.fullText).toBe('সমাধান');
  });
});
