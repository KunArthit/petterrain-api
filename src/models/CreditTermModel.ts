export interface CreditTermModel {
  term_id: number;
  user_id: number;
  credit_limit: number;
  payment_term_days: number;
  is_active: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
