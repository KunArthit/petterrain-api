export interface InvoiceModel {
  invoice_id: number;
  order_id: number;
  invoice_no: string; // หรือ invoice_number, ให้แน่ใจว่าตรงกับที่ใช้ใน DB และ query
  invoice_date: Date | string; // สามารถรับได้ทั้ง Date object หรือ string
  due_date: Date | string; // สามารถรับได้ทั้ง Date object หรือ string

  subtotal: number;
  tax_amount: number | null; // สามารถเป็น number หรือ null
  shipping_cost: number | null; // สามารถเป็น number หรือ null
  total_amount: number;
  payment_status: string;
  notes: string | null; // สามารถเป็น string หรือ null
  created_at: Date;

  address: string | null;
  sub_district: string | null;
  district: string | null;
  province: string | null;
  zipcode: string | null;
  country: string | null;
  phone_number: string | null;
  customer_name: string | null;
  tracking: string | null;
}

export interface InvoiceModelPrint {
  // จากตาราง invoices
  invoice_id: number;
  order_id: number;
  invoice_no: string;
  invoice_date: Date;
  due_date: Date;
  subtotal: number;
  tax_amount: number | null;
  shipping_cost: number | null;
  total_amount: number;
  payment_status: string;
  notes: string | null;
  created_at: Date;

  // จาก orders
  order_status?: string;
  payment_method?: string;
  tracking_number?: string;
  updated_at?: Date;

  // จาก users
  first_name?: string;
  last_name?: string;

  // จาก user_addresses
  address_id?: number;
  address_line1?: string;
  address_line2?: string | null;
  address_type?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_default?: boolean;
}
