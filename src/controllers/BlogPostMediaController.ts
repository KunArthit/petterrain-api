import { Elysia, t } from "elysia";
import BlogPostMediaService from "../classes/BlogPostMediaClass";

const blogPostMediaController = new Elysia({
  prefix: "/blog-post-media",
  tags: ["Blog Post Media"],
})
  // Get all media records
  .get("/", async () => {
    try {
      return await BlogPostMediaService.getAllMedia();
    } catch (error) {
      throw new Error("Failed to fetch media records");
    }
  })

  // Get media by ID
  .get("/:id", async ({ params }) => {
    try {
      const media = await BlogPostMediaService.getMediaById(Number(params.id));
      if (!media) throw new Error("Media record not found");
      return media;
    } catch (error) {
      throw new Error("Failed to fetch media record");
    }
  })

  // Get media by Post ID
  .get("/post/:post_id", async ({ params }) => {
    try {
      return await BlogPostMediaService.getMediaByPostId(
        Number(params.post_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch media for post");
    }
  })

  // Create media record
  .post(
    "/",
    async ({ body }) => {
      try {
        const mediaId = await BlogPostMediaService.createMedia({
          ...body,
          caption: body.caption ?? null,
          display_order: body.display_order ?? null,
        });
        return { message: "Media record created", media_id: mediaId };
      } catch (error) {
        throw new Error("Failed to create media record");
      }
    },
    {
      body: t.Object({
        post_id: t.Number(),
        media_type: t.String(),
        media_url: t.String(),
        caption: t.Optional(t.String()),
        display_order: t.Optional(t.Number()),
      }),
    }
  )

  // Update media record
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await BlogPostMediaService.updateMedia(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Media update failed");
        return { message: "Media record updated" };
      } catch (error) {
        throw new Error("Failed to update media record");
      }
    },
    {
      body: t.Partial(
        t.Object({
          post_id: t.Number(),
          media_type: t.String(),
          media_url: t.String(),
          caption: t.Optional(t.String()),
          display_order: t.Optional(t.Number()),
        })
      ),
    }
  )

  // Delete media record
  .delete("/:id", async ({ params }) => {
    try {
      const success = await BlogPostMediaService.deleteMedia(Number(params.id));
      if (!success) throw new Error("Media deletion failed");
      return { message: "Media record deleted" };
    } catch (error) {
      throw new Error("Failed to delete media record");
    }
  });

export default blogPostMediaController;
