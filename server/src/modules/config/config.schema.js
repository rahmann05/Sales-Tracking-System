import { z } from 'zod';

export const updateConfigSchema = z.object({
  body: z.object({
    value: z.any().refine(val => val !== undefined, "Config value is required"),
  }),
});
