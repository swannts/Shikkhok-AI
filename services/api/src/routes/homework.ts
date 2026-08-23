import { Router, Request, Response } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.post('/upload-and-analyze', upload.single('file'), (req: Request, res: Response) => {
  return res.json({
    detectionId: 'det-' + Date.now(),
    extractedText: '3x + 15 = 45 সমীকরণের সমাধান কীভাবে বের করব?',
    subject: 'গণিত',
    suggestedPrompts: [
      'ধাপে ধাপে সমাধান বুঝিয়ে দাও',
      'এই জাতীয় আরও ৩টি প্র্যাকটিস প্রশ্ন দাও',
      'ভিজুয়াল ডায়াগ্রাম দেখে শেখাও',
    ],
  });
});

export default router;
