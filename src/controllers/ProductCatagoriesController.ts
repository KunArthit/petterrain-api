import { Elysia, t } from "elysia";
import ProductCategoryService from "../classes/ProductCatagoriesClass";
import { ProductCategoryModel } from "@/models/ProductCatagoriesModel";

const productCategoryController = new Elysia({
  prefix: "/product-categories",
  tags: ["Product-categories"],
})
  // Get all product categories
  .get("/", async () => {
    try {
      return await ProductCategoryService.getAllCategories();
    } catch (error) {
      throw new Error("Failed to fetch product categories");
    }
  })

  // Get product category by ID
  .get("/:id", async ({ params }) => {
    try {
      const category = await ProductCategoryService.getCategoryById(
        Number(params.id)
      );
      if (!category) throw new Error("Product category not found");
      return category;
    } catch (error) {
      throw new Error("Failed to fetch product category");
    }
  })

  // Create product category
  .post(
    "/",
    async ({ body }) => {
      try {
        const categoryId = await ProductCategoryService.createCategory({
          ...body,
          description: body.description ?? null,
          image_url: body.image_url ?? null,
        });
        return {
          message: "Product category created",
          category_id: categoryId,
        };
      } catch (error) {
        throw new Error("Failed to create product category");
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        nameEn: t.String(),
        descriptionEn: t.Optional(t.String()),
        image_url: t.Optional(t.String()),
        is_active: t.Boolean(),
      }),
    }
  )

  // Update product category
  // .put(
  //   "/:id",
  //   async ({
  //     params,
  //     body,
  //   }: {
  //     params: { id: string };
  //     body: Partial<Omit<any, "category_id">>;
  //   }) => {
  //     try {
  //       const success = await ProductCategoryService.updateCategory(
  //         Number(params.id),
  //         body
  //       );
  //       if (!success) throw new Error("Product category update failed");
  //       return { message: "Product category updated" };
  //     } catch (error) {
  //       throw new Error("Failed to update product category");
  //     }
  //   }
  // )

  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await ProductCategoryService.updateCategory(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Product category update failed");
        return { message: "Product category updated" };
      } catch (error) {
        throw new Error("Failed to update product category");
      }
    },
    {
      body: t.Object({
        lang: t.String(), // 'th' หรือ 'en'
        name: t.String(),
        description: t.Optional(t.String()),
        image_url: t.Optional(t.String()),
        is_active: t.Boolean(),
      }),
    }
  )

  // Delete product category
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ProductCategoryService.deleteCategory(
        Number(params.id)
      );
      if (!success) throw new Error("Product category deletion failed");
      return { message: "Product category deleted" };
    } catch (error) {
      throw new Error("Failed to delete product category");
    }
  });

export default productCategoryController;
