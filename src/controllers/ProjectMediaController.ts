import { Elysia, t } from "elysia";
import ProjectMediaService from "../classes/ProjectMediaClass";
import { ProjectMediaModel } from "@/models/ProjectMediaModel";

const projectMediaController = new Elysia({
  prefix: "/project-media",
  tags: ["Project media"],
})
  // Get all project media
  .get("/", async () => {
    try {
      return await ProjectMediaService.getAllMedia();
    } catch (error) {
      throw new Error("Failed to fetch project media");
    }
  })

  // Get project media by ID
  .get("/:id", async ({ params }) => {
    try {
      const media = await ProjectMediaService.getMediaById(Number(params.id));
      if (!media) throw new Error("Project media not found");
      return media;
    } catch (error) {
      throw new Error("Failed to fetch project media");
    }
  })

  // Get media by Project ID
  .get("/project/:project_id", async ({ params }) => {
    try {
      return await ProjectMediaService.getMediaByProjectId(
        Number(params.project_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch project media for project");
    }
  })

  // Create project media
  .post(
    "/",
    async ({ body }) => {
      try {
        const mediaId = await ProjectMediaService.createMedia({
          ...body,
          caption: body.caption ?? null,
          display_order: body.display_order ?? null,
        });
        return { message: "Project media created", media_id: mediaId };
      } catch (error) {
        throw new Error("Failed to create project media");
      }
    },
    {
      body: t.Object({
        project_id: t.Number(),
        media_type: t.String(),
        media_url: t.String(),
        caption: t.Optional(t.String()),
        display_order: t.Optional(t.Number()),
      }),
    }
  )

  // Update project media
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<ProjectMediaModel, "media_id">>;
    }) => {
      try {
        const success = await ProjectMediaService.updateMedia(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Project media update failed");
        return { message: "Project media updated" };
      } catch (error) {
        throw new Error("Failed to update project media");
      }
    }
  )

  // Delete project media
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ProjectMediaService.deleteMedia(Number(params.id));
      if (!success) throw new Error("Project media deletion failed");
      return { message: "Project media deleted" };
    } catch (error) {
      throw new Error("Failed to delete project media");
    }
  });

export default projectMediaController;
