
export enum CartWishlistType {
  Cart = "cart",
  Wishlist = "wishlist",
}


export interface CartWishlistModel {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  type: CartWishlistType;
  created_at: Date;
  updated_at: Date;
}