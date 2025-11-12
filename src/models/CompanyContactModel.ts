export interface CompanyContactModel {
  contact_id: number;
  company_user_id: number;
  contact_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: Date;
}
