import { Elysia, t } from "elysia";
import SolutionContentService from "../classes/SolutionContentClass";
import { SolutionContentModel } from "@/models/SolutionContentModel";

const solutionContentController = new Elysia({
  prefix: "/solution-content",
  tags: ["Solution content"],
})
  // Get all solution content
  .get("/", async () => {
    try {
      return await SolutionContentService.getAllContent();
    } catch (error) {
      throw new Error("Failed to fetch solution content");
    }
  })

  // Get solution content by ID
  .get("/:id", async ({ params }) => {
    try {
      const content = await SolutionContentService.getContentById(
        Number(params.id)
      );
      if (!content) throw new Error("Solution content not found");
      return content;
    } catch (error) {
      throw new Error("Failed to fetch solution content");
    }
  })

  // Get content by Solution ID
  .get("/solution/:solution_id", async ({ params }) => {
    try {
      return await SolutionContentService.getContentBySolutionId(
        Number(params.solution_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch solution content for solution");
    }
  })

  // Create solution content
  // .post(
  //   "/",
  //   async ({ body }) => {
  //     try {
  //       const contentId = await SolutionContentService.createContent({
  //         ...body,
  //         content_order: body.content_order ?? null,
  //       });
  //       return { message: "Solution content created", content_id: contentId };
  //     } catch (error) {
  //       throw new Error("Failed to create solution content");
  //     }
  //   },
  //   {
  //     body: t.Object({
  //       solution_id: t.Number(),
  //       title: t.String(),
  //       content: t.String(),
  //       content_order: t.Optional(t.Number()),
  //     }),
  //   }
  // )

  // .post(
  //   "/",
  //   async ({ body }) => {
  //     try {
  //       const contentId = await SolutionContentService.createContent({
  //         ...body,
  //         // ถ้าไม่ได้ส่งมาก็จะเป็น undefined ซึ่ง TypeScript ยอมรับได้
  //         content_order: body.content_order,
  //       });

  //       return { message: "Solution content created", content_id: contentId };
  //     } catch (error) {
  //       console.error("Failed to create solution content:", error);
  //       throw new Error("Failed to create solution content");
  //     }
  //   },
  //   {
  //     body: t.Object({
  //       solution_id: t.Number(),
  //       title: t.String(), // TH
  //       content: t.String(), // TH
  //       title_en: t.Optional(t.String()), // EN optional
  //       content_en: t.Optional(t.String()), // EN optional
  //       content_order: t.Optional(t.Number()), // ไม่ต้อง null ได้
  //       image_url: t.Optional(t.String()), // ✅ optional
  //     }),
  //   }
  // )

  .post(
    "/",
    async ({ body }) => {
      try {
        const contentId = await SolutionContentService.createContent({
          ...body,
          content_order: body.content_order ?? null,
        });
        return { message: "Solution content created", content_id: contentId };
      } catch (error) {
        throw new Error("Failed to create solution content");
      }
    },
    {
      body: t.Object({
        solution_id: t.Number(),
        title: t.String(),
        title_th: t.String(),
        content: t.String(),
        content_th: t.String(),
        content_order: t.Optional(t.Number()),
      }),
    }
  )

  // Update solution content
  .put(
    "/:id",
    async ({ params, body, set }) => {

      console.log(body);
      
      try {
        const success = await SolutionContentService.updateContent(
          Number(params.id),
          body
        );
        if (!success) {
          set.status = 404;
          throw new Error("Solution content update failed");
        }
        return {
          success: true,
          message: "Solution content updated",
          content_id: params.id,
        };
      } catch (error) {
        set.status =
          error instanceof Error && error.message.includes("not found")
            ? 404
            : 500;
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update solution content",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        solution_id: t.Optional(t.Number()),
        title: t.Optional(t.String()),
        title_th: t.Optional(t.String()),
        content: t.Optional(t.String()),
        content_th: t.Optional(t.String()),
        content_order: t.Optional(t.Number()),
        image_url: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )

  // Reorder multiple solution content sections
  .put(
    "/reorder",
    async ({ body }) => {
      try {
        const updated = await SolutionContentService.reorderContents(
          body.contents
        );
        if (!updated) throw new Error("Reorder failed");
        return { message: "Reorder successful" };
      } catch (error) {
        throw new Error("Failed to reorder solution content");
      }
    },
    {
      body: t.Object({
        contents: t.Array(
          t.Object({
            content_id: t.Number(),
            content_order: t.Number(),
          })
        ),
      }),
    }
  )

  // Delete solution content
  .delete("/:id", async ({ params }) => {
    try {
      const success = await SolutionContentService.deleteContent(
        Number(params.id)
      );
      if (!success) throw new Error("Solution content deletion failed");
      return { message: "Solution content deleted" };
    } catch (error) {
      throw new Error("Failed to delete solution content");
    }
  });

export default solutionContentController;
