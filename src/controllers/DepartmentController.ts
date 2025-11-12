import { Elysia, t } from "elysia";
import DepartmentService from "../classes/DepartmentClass";
import { DepartmentModel } from "@/models/DepartmentModel";

const departmentController = new Elysia({
  prefix: "/department",
  tags: ["Department"],
})
  // Get all departments
  .get("/", async () => {
    try {
      return await DepartmentService.getAllDepartments();
    } catch (error) {
      throw new Error("Failed to fetch departments");
    }
  })

  // Get department by ID
  .get("/:id", async ({ params }) => {
    try {
      const department = await DepartmentService.getDepartmentById(
        Number(params.id)
      );
      if (!department) throw new Error("Department not found");
      return department;
    } catch (error) {
      throw new Error("Failed to fetch department");
    }
  })

  // Create department
  .post(
    "/",
    async ({ body }) => {
      try {
        const departmentId = await DepartmentService.createDepartment({
          ...body,
          description: body.description ?? null,
        });
        return { message: "Department created", department_id: departmentId };
      } catch (error) {
        throw new Error("Failed to create department");
      }
    },
    {
      body: t.Object({
        department_name: t.String(),
        description: t.Optional(t.String()),
      }),
    }
  )

  // Update department
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<DepartmentModel, "department_id">>;
    }) => {
      try {
        const success = await DepartmentService.updateDepartment(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Department update failed");
        return { message: "Department updated" };
      } catch (error) {
        throw new Error("Failed to update department");
      }
    }
  )

  // Delete department
  .delete("/:id", async ({ params }) => {
    try {
      const success = await DepartmentService.deleteDepartment(
        Number(params.id)
      );
      if (!success) throw new Error("Department deletion failed");
      return { message: "Department deleted" };
    } catch (error) {
      throw new Error("Failed to delete department");
    }
  });

export default departmentController;
