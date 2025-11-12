export interface ProductImageModel {
  image_id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number | null;
}
