import { Elysia, t } from "elysia";
import HotProductService from "../classes/HotProductClass";
import { HotProductModel } from "@/models/HotProductModel";

const hotProductController = new Elysia({
  prefix: "/hot-product",
  tags: ["Hot Product"],
})
  // Get all hot products
  .get("/", async () => {
    try {
      return await HotProductService.getAllHotProducts();
    } catch (error) {
      throw new Error("Failed to fetch hot products");
    }
  })

  // Get hot product by ID
  .get("/:id", async ({ params }) => {
    try {
      const hotProduct = await HotProductService.getHotProductById(
        Number(params.id)
      );
      if (!hotProduct) throw new Error("Hot product not found");
      return hotProduct;
    } catch (error) {
      throw new Error("Failed to fetch hot product");
    }
  })

  // Get hot products by Product ID
  .get("/product/:product_id", async ({ params }) => {
    try {
      return await HotProductService.getHotProductsByProductId(
        Number(params.product_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch hot products for product");
    }
  })

  // Create hot product
  .post(
    "/",
    async ({ body }) => {
      try {
        const hotProductId = await HotProductService.createHotProduct({
          ...body,
          display_order: body.display_order ?? null,
        });
        return { message: "Hot product created", id: hotProductId };
      } catch (error) {
        throw new Error("Failed to create hot product");
      }
    },
    {
      body: t.Object({
        product_id: t.Number(),
        display_order: t.Optional(t.Number()),
      }),
    }
  )

  // Update hot product
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<HotProductModel, "id" | "created_at">>;
    }) => {
      try {
        const success = await HotProductService.updateHotProduct(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Hot product update failed");
        return { message: "Hot product updated" };
      } catch (error) {
        throw new Error("Failed to update hot product");
      }
    }
  )

  // Delete hot product
  .delete("/:id", async ({ params }) => {
    try {
      const success = await HotProductService.deleteHotProduct(
        Number(params.id)
      );
      if (!success) throw new Error("Hot product deletion failed");
      return { message: "Hot product deleted" };
    } catch (error) {
      throw new Error("Failed to delete hot product");
    }
  })
;

export default hotProductController;
