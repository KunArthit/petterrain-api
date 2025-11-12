import { Elysia, t } from "elysia";
import ProjectExampleService from "../classes/ProjectExampleClass";
import { ProjectExampleModel } from "@/models/ProjectExampleModel";

const projectExampleController = new Elysia({
  prefix: "/project-example",
  tags: ["Project Example"],
})
  // Get all project examples
  .get("/", async () => {
    try {
      return await ProjectExampleService.getAllProjects();
    } catch (error) {
      throw new Error("Failed to fetch project examples");
    }
  })

  // Get project example by ID
  .get("/:id", async ({ params }) => {
    try {
      const project = await ProjectExampleService.getProjectById(
        Number(params.id)
      );
      if (!project) throw new Error("Project example not found");
      return project;
    } catch (error) {
      throw new Error("Failed to fetch project example");
    }
  })

  // Get projects by Solution ID
  .get("/solution/:solution_id", async ({ params }) => {
    try {
      return await ProjectExampleService.getProjectsBySolutionId(
        Number(params.solution_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch project examples for solution");
    }
  })

  // Create project example
  .post(
    "/",
    async ({ body }) => {
      try {
        const projectId = await ProjectExampleService.createProject({
          ...body,
          client_name: body.client_name ?? null,
          completed_date: body.completed_date
            ? new Date(body.completed_date)
            : null,
          featured_image: body.featured_image ?? null,
        });
        return { message: "Project example created", project_id: projectId };
      } catch (error) {
        throw new Error("Failed to create project example");
      }
    },
    {
      body: t.Object({
        solution_id: t.Number(),
        title: t.String(),
        description: t.String(),
        client_name: t.Optional(t.String()),
        completed_date: t.Optional(t.String()), // Date format (YYYY-MM-DD)
        featured_image: t.Optional(t.String()),
        is_active: t.Boolean(),
      }),
    }
  )

  // Update project example
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<ProjectExampleModel, "project_id" | "created_at">>;
    }) => {
      try {
        const success = await ProjectExampleService.updateProject(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Project example update failed");
        return { message: "Project example updated" };
      } catch (error) {
        throw new Error("Failed to update project example");
      }
    }
  )

  // Delete project example
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ProjectExampleService.deleteProject(
        Number(params.id)
      );
      if (!success) throw new Error("Project example deletion failed");
      return { message: "Project example deleted" };
    } catch (error) {
      throw new Error("Failed to delete project example");
    }
  });

export default projectExampleController;
