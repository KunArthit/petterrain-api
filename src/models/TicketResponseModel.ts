export interface TicketResponseModel {
  response_id: number;
  ticket_id: number;
  user_id: number | null;
  response_text: string;
  created_at: Date;
}
