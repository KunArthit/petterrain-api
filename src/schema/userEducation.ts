import { z } from 'zod'

export const userEducationSchema = z.object({
  user_id: z.number().int(),
  highest_education: z.string().min(1),
  institution_name: z.string().min(1),
  major: z.string().min(1),
  graduation_year: z.number().int()
})