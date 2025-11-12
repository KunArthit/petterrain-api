import { z } from 'zod'

export const userCertificateSchema = z.object({
  user_id: z.number().int(),
  certificate_name: z.string().min(1),
  issued_by: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // format YYYY-MM-DD
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  certificate_file: z.string().url()
})