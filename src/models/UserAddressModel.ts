export interface UserAddressModel {
  address_id: number;
  user_id: number;
  address_type: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}
