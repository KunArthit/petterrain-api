import { Elysia, t } from "elysia";
import AdminPermissionService from "../classes/AdminPermissionsClass";
import { AdminPermissionModel } from "../models/AdminPermissionsModel";

const adminPermissionController = new Elysia({
  prefix: "/admin-permissions",
  tags: ["Admin Permissions"],
})
  // Get all admin permissions
  .get("/", async () => {
    try {
      return await AdminPermissionService.getAllPermissions();
    } catch (error) {
      throw new Error("Failed to fetch admin permissions");
    }
  })

  // Get permission by ID
  .get("/:id", async ({ params }) => {
    try {
      const permission = await AdminPermissionService.getPermissionById(
        Number(params.id)
      );
      if (!permission) throw new Error("Admin permission not found");
      return permission;
    } catch (error) {
      throw new Error("Failed to fetch admin permission");
    }
  })

  // Get permissions by Admin ID
  .get("/admin/:admin_id", async ({ params }) => {
    try {
      return await AdminPermissionService.getPermissionsByAdminId(
        Number(params.admin_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch admin permissions for admin");
    }
  })

  // Create admin permission
  .post(
    "/",
    async ({ body }) => {
      try {
        const permissionId = await AdminPermissionService.createPermission(
          body
        );
        return {
          message: "Admin permission created",
          permission_id: permissionId,
        };
      } catch (error) {
        throw new Error("Failed to create admin permission");
      }
    },
    {
      body: t.Object({
        admin_id: t.Number(),
        can_manage_products: t.Boolean(),
        can_manage_orders: t.Boolean(),
        can_manage_customers: t.Boolean(),
        can_manage_content: t.Boolean(),
        can_manage_blog: t.Boolean(),
        can_manage_accounting: t.Boolean(),
        can_manage_admins: t.Boolean(),
        can_view_reports: t.Boolean(),
        can_manage_tickets: t.Boolean(),
        can_manage_chat: t.Boolean(),
      }),
    }
  )

  // Update admin permission
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<AdminPermissionModel, "permission_id">>;
    }) => {
      try {
        const permissionData = body;
        const success = await AdminPermissionService.updatePermission(
          Number(params.id),
          permissionData
        );
        if (!success) throw new Error("Admin permission update failed");
        return { message: "Admin permission updated" };
      } catch (error) {
        throw new Error("Failed to update admin permission");
      }
    }
  )

  // Delete admin permission
  .delete("/:id", async ({ params }) => {
    try {
      const success = await AdminPermissionService.deletePermission(
        Number(params.id)
      );
      if (!success) throw new Error("Admin permission deletion failed");
      return { message: "Admin permission deleted" };
    } catch (error) {
      throw new Error("Failed to delete admin permission");
    }
  });

export default adminPermissionController;
