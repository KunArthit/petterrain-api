export interface AdminPermissionModel {
  permission_id: number;
  admin_id: number;
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_customers: boolean;
  can_manage_content: boolean;
  can_manage_blog: boolean;
  can_manage_accounting: boolean;
  can_manage_admins: boolean;
  can_view_reports: boolean;
  can_manage_tickets: boolean;
  can_manage_chat: boolean;
}
