export interface ProductModel {
  product_id: number;
  category_id: number;
  product_category_id: number;
  name: string;
  sku: string;
  description: string;
  short_description: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  created_at: Date;
  updated_at: Date;
  images?: string[];
  videos?: {
    url: string;
    type: string;
  }[];
  solution_category_name?: string;
  solution_category_id?: number;
  product_category_name?: string;
  action?: string;
}
