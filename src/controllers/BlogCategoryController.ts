import { Elysia, t } from "elysia";
import BlogCategoryService from "../classes/BlogCategoryClass";

const blogCategoryController = new Elysia({
  prefix: "/blog-categories",
  tags: ["Blog Categories"],
})
  // Get all blog categories
  .get("/", async () => {
    try {
      return await BlogCategoryService.getAllCategories();
    } catch (error) {
      throw new Error("Failed to fetch blog categories");
    }
  })

  // Get blog category by ID
  .get("/:id", async ({ params }) => {
    try {
      const category = await BlogCategoryService.getCategoryById(
        Number(params.id)
      );
      if (!category) throw new Error("Blog category not found");
      return category;
    } catch (error) {
      throw new Error("Failed to fetch blog category");
    }
  })

  // Create blog category
  .post(
    "/",
    async ({ body }) => {
      try {
        const categoryId = await BlogCategoryService.createCategory({
          ...body,
          description: body.description ?? null,
        });
        return { message: "Blog category created", category_id: categoryId };
      } catch (error) {
        throw new Error("Failed to create blog category");
      }
    },
    {
      body: t.Object({
        name: t.String(),
        slug: t.String(),
        description: t.Optional(t.String()),
      }),
    }
  )

  // Update blog category
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await BlogCategoryService.updateCategory(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Blog category update failed");
        return { message: "Blog category updated" };
      } catch (error) {
        throw new Error("Failed to update blog category");
      }
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          slug: t.String(),
          description: t.Optional(t.String()),
        })
      ),
    }
  )

  // Delete blog category
  .delete("/:id", async ({ params }) => {
    try {
      const success = await BlogCategoryService.deleteCategory(
        Number(params.id)
      );
      if (!success) throw new Error("Blog category deletion failed");
      return { message: "Blog category deleted" };
    } catch (error) {
      throw new Error("Failed to delete blog category");
    }
  });

export default blogCategoryController;
