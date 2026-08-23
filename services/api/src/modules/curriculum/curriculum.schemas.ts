import { z } from 'zod';

export const getSubjectsQuerySchema = z.object({
  classId: z.string().optional().default('class-8'),
});

export const getChaptersParamsSchema = z.object({
  subjectId: z.string().min(1, 'subjectId is required'),
});

export type GetSubjectsQuery = z.infer<typeof getSubjectsQuerySchema>;
export type GetChaptersParams = z.infer<typeof getChaptersParamsSchema>;
