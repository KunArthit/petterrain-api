import { z } from 'zod'

export const userContactSchema = z.object({
  user_id: z.number().int(),
  address: z.string().min(1),
  province: z.string().min(1),
  district: z.string().min(1),
  sub_district: z.string().min(1),
  postal_code: z.string().min(1),
  phone: z.string().min(9).max(15),
  orcid_id: z.string().optional(),
  google_scholar_id: z.string().optional(),
  facebook: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  line: z.string().optional()
})