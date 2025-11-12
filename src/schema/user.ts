import { z } from 'zod'

export const userSchema = z.object({
  user_type: z.string().min(1),
  prefix: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']), 
  age_range: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(6),
  photo: z.string().url().optional()
})