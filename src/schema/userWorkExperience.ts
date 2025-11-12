import { z } from 'zod'

export const userWorkExperienceSchema = z.object({
  user_id: z.number().int(),
  organization_name: z.string().min(1),
  position: z.string().min(1),
  level: z.string().min(1),
  position_type: z.string().min(1),
  years_of_experience: z.number().nonnegative(),
  years_it_security: z.number().nonnegative()
})