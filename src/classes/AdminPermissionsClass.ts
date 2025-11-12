import { AdminPermissionModel } from "../models/AdminPermissionsModel";
import db from "@/core/database";

class AdminPermissionService {
  // Get all admin permissions
  async getAllPermissions(): Promise<AdminPermissionModel[]> {
    const query = `SELECT * FROM admin_permissions;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as AdminPermissionModel[];
    } catch (error) {
      console.error("Failed to fetch admin permissions:", error);
      throw new Error("Failed to fetch admin permissions");
    } finally {
      conn.release();
    }
  }

  // Get permissions by ID
  async getPermissionById(
    permission_id: number
  ): Promise<AdminPermissionModel | null> {
    const query = `SELECT * FROM admin_permissions WHERE permission_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: any = await conn.query(query, [permission_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch admin permission:", error);
      throw new Error("Failed to fetch admin permission");
    } finally {
      conn.release();
    }
  }

  // Get permissions by Admin ID
  async getPermissionsByAdminId(
    admin_id: number
  ): Promise<AdminPermissionModel | null> {
    const query = `SELECT * FROM admin_permissions WHERE admin_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: any = await conn.query(query, [admin_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch admin permissions by Admin ID:", error);
      throw new Error("Failed to fetch admin permissions by Admin ID");
    } finally {
      conn.release();
    }
  }

  // Create a new admin permission record
  async createPermission(
    permission: Omit<AdminPermissionModel, "permission_id">
  ): Promise<number> {
    const query = `
      INSERT INTO admin_permissions (admin_id, can_manage_products, can_manage_orders, can_manage_customers, can_manage_content, 
        can_manage_blog, can_manage_accounting, can_manage_admins, can_view_reports, can_manage_tickets, can_manage_chat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        permission.admin_id,
        permission.can_manage_products,
        permission.can_manage_orders,
        permission.can_manage_customers,
        permission.can_manage_content,
        permission.can_manage_blog,
        permission.can_manage_accounting,
        permission.can_manage_admins,
        permission.can_view_reports,
        permission.can_manage_tickets,
        permission.can_manage_chat,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create admin permission:", error);
      throw new Error("Failed to create admin permission");
    } finally {
      conn.release();
    }
  }

  // Update admin permission
  async updatePermission(
    permission_id: number,
    permission: Partial<Omit<AdminPermissionModel, "permission_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE admin_permissions
      SET admin_id=?, can_manage_products=?, can_manage_orders=?, can_manage_customers=?, can_manage_content=?, 
          can_manage_blog=?, can_manage_accounting=?, can_manage_admins=?, can_view_reports=?, can_manage_tickets=?, can_manage_chat=?
      WHERE permission_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        permission.admin_id,
        permission.can_manage_products,
        permission.can_manage_orders,
        permission.can_manage_customers,
        permission.can_manage_content,
        permission.can_manage_blog,
        permission.can_manage_accounting,
        permission.can_manage_admins,
        permission.can_view_reports,
        permission.can_manage_tickets,
        permission.can_manage_chat,
        permission_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update admin permission:", error);
      throw new Error("Failed to update admin permission");
    } finally {
      conn.release();
    }
  }

  // Delete admin permission
  async deletePermission(permission_id: number): Promise<boolean> {
    const query = `DELETE FROM admin_permissions WHERE permission_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [permission_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete admin permission:", error);
      throw new Error("Failed to delete admin permission");
    } finally {
      conn.release();
    }
  }
}

export default new AdminPermissionService();
