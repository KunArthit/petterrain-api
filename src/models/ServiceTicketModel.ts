export interface ServiceTicketModel {
  ticket_id: number;
  user_id: number | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: number | null;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}
