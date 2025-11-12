export interface PaymentTransactionModel {
  transaction_id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  transaction_status: string;
  transaction_reference: string | null;
  payment_date: Date | null;
  notes: string | null;
  created_at: Date;
}
