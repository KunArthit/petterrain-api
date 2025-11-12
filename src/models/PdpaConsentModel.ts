export interface PdpaConsentModel {
  consent_id: number;
  user_id: number;
  ip_address: string;
  consent_text: string;
  consented: boolean;
  consent_date: Date;
}
