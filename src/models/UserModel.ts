export interface UserModel {
  user_id: number;
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type_id: number;
  department_id: number;
  company_name: string;
  tax_id: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserCartAndWishModel {
  cart_list_id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  // Product info
  category_id: number;
  sku: string;
  description: string;
  short_description: string;
  price: number;
  sale_price: number;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  product_category_id: number;
}