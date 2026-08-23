import { z } from 'zod';

export const completeLessonParamsSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
});

export const completeLessonBodySchema = z.object({
  progress: z.number().min(0).max(1).default(1.0),
});

export type CompleteLessonParams = z.infer<typeof completeLessonParamsSchema>;
export type CompleteLessonBody = z.infer<typeof completeLessonBodySchema>;
