import { Elysia, t } from "elysia";
import SolutionMediaService from "../classes/SolutionMediaClass";

const ALLOWED_MEDIA_TYPES = ["image", "video", "document", "audio"];
const MAX_URL_LENGTH = 2048;
const MAX_CAPTION_LENGTH = 1000;

const solutionMediaController = new Elysia({
  prefix: "/solution-media",
  tags: ["Solution Media"],
})
  .onError(({ error, set }) => {
    console.error("Validation error:", error);
    if ((error as any).code === "VALIDATION") {
      set.status = 422;
      return {
        success: false,
        error: "Validation failed",
        message: error.message,
        details: (error as any).all || (error as any).validator?.Errors || [],
      };
    }
  })
  .post(
    "/",
    async ({ body, set }: { body: any; set: any }) => {
      try {
        console.log("Received body:", JSON.stringify(body, null, 2));

        const service = new SolutionMediaService();
        const mediaId = await service.createSolutionMedia(body);

        set.status = 201;
        return {
          success: true,
          message: "Solution media created successfully",
          data: {
            media_id: mediaId,
          },
        };
      } catch (error: any) {
        console.error("Controller error:", error);
        return handleDatabaseError(error, set);
      }
    },
    {
      body: t.Object({
        solution_content_id: t.Number({ minimum: 1 }),
        media_type: t.String({
          minLength: 1,
          maxLength: 50,
          pattern: `^(${ALLOWED_MEDIA_TYPES.join("|")})$`,
        }),
        media_url: t.String({
          minLength: 1,
          maxLength: MAX_URL_LENGTH,
          format: "uri",
        }),
        caption: t.Optional(
          t.String({
            maxLength: MAX_CAPTION_LENGTH,
          })
        ),
        display_order: t.Optional(
          t.Number({
            minimum: 0,
            maximum: 9999,
          })
        ),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params, set }: { params: { id: string }; set: any }) => {
      try {
        const mediaId = parseInt(params.id);
        if (isNaN(mediaId)) {
          set.status = 400;
          return {
            success: false,
            error: "Invalid media ID",
            message: "Media ID must be a valid number",
          };
        }

        const service = new SolutionMediaService();
        const media = await service.getSolutionMediaById(mediaId);

        if (!media) {
          set.status = 404;
          return {
            success: false,
            error: "Not found",
            message: "Solution media not found",
          };
        }

        return {
          success: true,
          data: media,
        };
      } catch (error: any) {
        return handleDatabaseError(error, set);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .get(
    "/category/:categoryId",
    async ({ params, set }: { params: { categoryId: string }; set: any }) => {
      try {
        const categoryId = parseInt(params.categoryId);
        if (isNaN(categoryId)) {
          set.status = 400;
          return {
            success: false,
            error: "Invalid category ID",
            message: "Category ID must be a valid number",
          };
        }

        const service = new SolutionMediaService();
        const media = await service.getSolutionMediaByCategory(categoryId);

        return {
          success: true,
          data: media,
          count: media.length,
        };
      } catch (error: any) {
        return handleDatabaseError(error, set);
      }
    },
    {
      params: t.Object({
        categoryId: t.String(),
      }),
    }
  )
  .put(
    "/:id",
    async ({
      params,
      body,
      set,
    }: {
      params: { id: string };
      body: any;
      set: any;
    }) => {
      try {
        const mediaId = parseInt(params.id);
        if (isNaN(mediaId)) {
          set.status = 400;
          return {
            success: false,
            error: "Invalid media ID",
            message: "Media ID must be a valid number",
          };
        }

        const service = new SolutionMediaService();
        const updated = await service.updateSolutionMedia(mediaId, body);

        if (!updated) {
          set.status = 404;
          return {
            success: false,
            error: "Not found",
            message: "Solution media not found",
          };
        }

        return {
          success: true,
          message: "Solution media updated successfully",
        };
      } catch (error: any) {
        return handleDatabaseError(error, set);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        solution_content_id: t.Optional(t.Number({ minimum: 1 })),
        media_type: t.Optional(
          t.String({
            minLength: 1,
            maxLength: 50,
            pattern: `^(${ALLOWED_MEDIA_TYPES.join("|")})$`,
          })
        ),
        media_url: t.Optional(
          t.String({
            minLength: 1,
            maxLength: MAX_URL_LENGTH,
            format: "uri",
          })
        ),
        caption: t.Optional(
          t.String({
            maxLength: MAX_CAPTION_LENGTH,
          })
        ),
        display_order: t.Optional(
          t.Number({
            minimum: 0,
            maximum: 9999,
          })
        ),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }: { params: { id: string }; set: any }) => {
      try {
        const mediaId = parseInt(params.id);
        if (isNaN(mediaId)) {
          set.status = 400;
          return {
            success: false,
            error: "Invalid media ID",
            message: "Media ID must be a valid number",
          };
        }

        const service = new SolutionMediaService();
        const deleted = await service.deleteSolutionMedia(mediaId);

        if (!deleted) {
          set.status = 404;
          return {
            success: false,
            error: "Not found",
            message: "Solution media not found",
          };
        }

        return {
          success: true,
          message: "Solution media deleted successfully",
        };
      } catch (error: any) {
        return handleDatabaseError(error, set);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );

function handleDatabaseError(error: any, set: any) {
  console.error("Database error:", error);

  if (error.code === "ER_DUP_ENTRY") {
    const duplicateValue =
      error.sqlMessage?.match(/Duplicate entry '(.+?)' for/)?.[1] || "value";
    set.status = 409;
    return {
      success: false,
      error: "Duplicate entry",
      message: `The value "${duplicateValue}" already exists.`,
      code: error.code,
    };
  }

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    set.status = 400;
    return {
      success: false,
      error: "Invalid reference",
      message: "Referenced category does not exist.",
      code: error.code,
    };
  }

  if (error.sqlMessage) {
    set.status = 400;
    return {
      success: false,
      error: "Database error",
      message: "Failed to process request due to a database error.",
      code: error.code,
    };
  }

  set.status = 500;
  return {
    success: false,
    error: "Internal server error",
    message: "An unexpected error occurred. Please try again later.",
  };
}

export default solutionMediaController;
