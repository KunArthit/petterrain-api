import { Elysia, t } from "elysia";
import UserTypeService from "../classes/UserTypeClass";

const UserTypeController = new Elysia({
  prefix: "/user-types",
  tags: ["User Types"],
})
  // Get all user types
  .get("/", async () => {
    try {
      return await UserTypeService.getAllUserTypes();
    } catch (error) {
      throw new Error("Failed to fetch user types");
    }
  })

  .get("/users", async () => {
    try {
      return await UserTypeService.getCountUserRole();
    } catch (error) {
      throw new Error("Failed to fetch user types");
    }
  })

  // Get user type by ID
  .get("/:id", async ({ params }) => {
    try {
      const userType = await UserTypeService.getUserTypeById(Number(params.id));
      if (!userType) throw new Error("User type not found");
      return userType;
    } catch (error) {
      throw new Error("Failed to fetch user type");
    }
  })

  // Create user type
  .post(
    "/",
    async ({ body }) => {
      try {
        const typeId = await UserTypeService.createUserType(body);
        return { message: "User type created", type_id: typeId };
      } catch (error) {
        throw new Error("Failed to create user type");
      }
    },
    {
      body: t.Object({
        type_name: t.String(),
      }),
    }
  )

  // Update user type
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await UserTypeService.updateUserType(
          Number(params.id),
          body
        );
        if (!success) throw new Error("User type update failed");
        return { message: "User type updated" };
      } catch (error) {
        throw new Error("Failed to update user type");
      }
    },
    {
      body: t.Object({
        type_name: t.String(),
      }),
    }
  )

  // Delete user type
  .delete("/:id", async ({ params }) => {
    try {
      await UserTypeService.deleteUserType(Number(params.id));
      return { message: "User type deleted" };
    } catch (error) {
      throw new Error(
        "Cannot delete: User type is referenced by other records"
      );
    }
  });

export default UserTypeController;
