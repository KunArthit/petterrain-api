import { Elysia, t } from "elysia";
import SolutionCategoryService from "../classes/SolutionCategoryClass";
import { SolutionCategoryModel } from "@/models/SolutionCategoryModel";

const solutionCategoryController = new Elysia({
  prefix: "/solution-categories",
  tags: ["Solution-categories"],
})
  // Get all solution categories
  .get("/", async () => {
    try {
      return await SolutionCategoryService.getAllCategories();
    } catch (error) {
      throw new Error("Failed to fetch solution categories");
    }
  })

  // Get solution category by ID
  .get("/:id", async ({ params }) => {
    try {
      const category = await SolutionCategoryService.getCategoryById(
        Number(params.id)
      );
      if (!category) throw new Error("Solution category not found");
      return category;
    } catch (error) {
      throw new Error("Failed to fetch solution category");
    }
  })

  // Create solution category
  .post(
    "/",
    async ({ body }) => {
      try {
        const categoryId = await SolutionCategoryService.createCategory({
          ...body,
          description: body.description ?? null,
          image_url: body.image_url ?? null,
        });
        return {
          message: "Solution category created",
          category_id: categoryId,
        };
      } catch (error) {
        throw new Error("Failed to create solution category");
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        name_en: t.String(),
        description_en: t.Optional(t.String()),
        image_url: t.Optional(t.String()),
        active: t.Boolean(),
      }),
    }
  )

  // Update solution category
  // .put(
  //   "/:id",
  //   async ({
  //     params,
  //     body,
  //   }: {
  //     params: { id: string };
  //     body: Partial<Omit<SolutionCategoryModel, "category_id">>;
  //   }) => {
  //     try {
  //       const success = await SolutionCategoryService.updateCategory(
  //         Number(params.id),
  //         body
  //       );
  //       if (!success) throw new Error("Solution category update failed");
  //       return { message: "Solution category updated" };
  //     } catch (error) {
  //       throw new Error("Failed to update solution category");
  //     }
  //   }
  // )

  .put(
    "/:id/:translationId",
    async ({ params, body }) => {
      const success = await SolutionCategoryService.updateCategory(
        Number(params.id),
        Number(params.translationId),
        body
      );
      if (!success) throw new Error("Solution category update failed");
      return { message: "Solution category updated" };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        image_url: t.Optional(t.String()),
        active: t.Optional(t.Union([t.Boolean(), t.Integer()])),
      }),
    }
  )

  // Delete solution category
  .delete("/:id", async ({ params }) => {
    try {
      const success = await SolutionCategoryService.deleteCategory(
        Number(params.id)
      );
      if (!success) throw new Error("Solution category deletion failed");
      return { message: "Solution category deleted" };
    } catch (error) {
      throw new Error("Failed to delete solution category");
    }
  });

export default solutionCategoryController;
