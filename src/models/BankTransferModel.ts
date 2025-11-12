export interface BankTransferModel {
    transfer_id: number;
    order_id: number;
    user_id: number;
    reference: string;
    slip_filename: string;
    slip_path: string;
    uploaded_at: Date | null;
    verified_at: Date | null;
    verified_by: number | null;
    status: string;
    note: string;
  }