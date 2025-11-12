// OrderModel.ts - Type definitions for Order and OrderItem

export type OrderStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "processing"
  | "shipped"
  | "awaiting_payment"
  | "delivered"
  | "cancelled"
  | "completed"
  | "failed";


export type PaymentMethod = "cod" | "bank_transfer" | "credit_card";

export interface OrderModel {
  order_id: number;
  invoice_no?: string;
  user_id: number;
  order_status: OrderStatus;
  is_bulk_order: boolean;
  bulk_order_type?: string | null;
  payment_method: PaymentMethod;
  shipping_address_id?: number | null;
  billing_address_id?: number | null;
  subtotal: number;
  shipping_cost?: number | null;
  tax_amount?: number | null;
  total_amount: number;
  tracking_number?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  // Virtual fields that may be added by joins
  items?: OrderItem[];
  item_count?: number;
}

export interface OrderItem {
  item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Virtual fields from product join
  product_name?: string;
  sku?: string;
  product_price?: number;
  sale_price?: number;
}

// Input types for creating orders
export interface CreateOrderInput {
  user_id: number;
  order_status?: string;
  is_bulk_order: boolean;
  bulk_order_type?: string;
  payment_method: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  subtotal: number;
  shipping_cost?: number;
  tax_amount?: number;
  total_amount: number;
  tracking_number?: string;
  notes?: string;
  items?: CreateOrderItemInput[];
}

export interface CreateOrderItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Input types for payment orders
export interface CreatePaymentOrderInput {
  invoice_no?: string;
  user_id: number;
  order_status?: string;
  is_bulk_order?: boolean;
  bulk_order_type?: "solution" | "equipment";
  payment_method: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  subtotal: number;
  shipping_cost?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
}

// Update types
export interface UpdateOrderInput {
  user_id?: number;
  order_status?: string;
  is_bulk_order?: boolean;
  bulk_order_type?: string;
  payment_method?: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  total_amount?: number;
  tracking_number?: string;
  notes?: string;
}

export interface UpdateOrderWithItemsInput {
  order: UpdateOrderInput;
  items?: UpdateOrderItemInput[];
}

export interface UpdateOrderItemInput {
  item_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Payment related types
export interface PaymentDetails {
  transaction_ref?: string;
  approval_code?: string;
  payment_method?: string;
  amount_paid?: number;
  payment_date?: string;
}

export interface OrderStatusDetails {
  tracking_number?: string;
  notes?: string;
}

// Analytics types
export interface PaymentAnalytics {
  payment_date: string;
  order_status: string;
  payment_method: string;
  order_count: number;
  total_amount: number;
  avg_amount: number;
}

// API Response types
export interface OrderResponse {
  success: boolean;
  order?: OrderModel;
  orders?: OrderModel[];
  message?: string;
  error?: boolean;
}

export interface OrderItemsResponse {
  success: boolean;
  order_id: number;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  success?: boolean;
  message: string;
  order_id: number;
  invoice_no?: string;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  count: number;
}
