import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Shikkhok AI Gateway', timestamp: new Date() });
});

// SSE Streaming AI Tutor Endpoint
app.post('/ai/v1/tutor/chat/stream', async (req: Request, res: Response) => {
  const { messages, topicId } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const simulatedDeltas = [
    'খুব ভালো প্রশ্ন! ',
    'এক চলক বিশিষ্ট সরল সমীকরণের ক্ষেত্রে ',
    'বাম পাশের সমীকরণটি ডান পাশে নেওয়ার সময় ',
    'যোগ থাকলে বিয়োগ এবং বিয়োগ থাকলে যোগ করতে হয়।\n\n',
    'যেমন: 2x + 5 = 15 সমীকরণে 5 বিয়োগ করলে 2x = 10 হয়। ',
    'অতএব, x = 5।\n\n',
    'তুমি কি আরেকটি প্র্যাকটিস সমস্যা সমাধান করতে চাও?',
  ];

  for (const delta of simulatedDeltas) {
    res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

app.listen(PORT, () => {
  console.log(`🤖 Shikkhok AI Gateway running on http://localhost:${PORT}`);
});
