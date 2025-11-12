export interface ChatMessageModel {
  message_id: number;
  session_id: number;
  sender_type: string;
  sender_id: number;
  message_text: string;
  is_read: boolean;
  created_at: Date;
}
