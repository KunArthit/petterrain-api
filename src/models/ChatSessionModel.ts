export interface ChatSessionModel {
  session_id: number;
  user_id: number;
  session_type: string;
  status: string;
  created_at: Date;
  closed_at: Date | null;
}
