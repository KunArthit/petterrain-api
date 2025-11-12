export interface QuotationModel {
  quotation_id: number;
  user_id: number;
  quotation_number: string;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number | null;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: Date;
}
