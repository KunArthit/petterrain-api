import { Elysia, t } from "elysia";
import ProductImageService from "../classes/ProductImageClass";

const productImageController = new Elysia({
  prefix: "/product-image",
  tags: ["Product Image"],
})
  // Get all product images
  .get("/", async () => {
    try {
      return await ProductImageService.getAllImages();
    } catch (error) {
      throw new Error("Failed to fetch product images");
    }
  })

  // Get product image by ID
  .get("/:id", async ({ params }) => {
    try {
      const image = await ProductImageService.getImageById(Number(params.id));
      if (!image) throw new Error("Product image not found");
      return image;
    } catch (error) {
      throw new Error("Failed to fetch product image");
    }
  })

  // Get images by Product ID
  .get("/product/:product_id", async ({ params }) => {
    try {
      return await ProductImageService.getImagesByProductId(
        Number(params.product_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch images for product");
    }
  })

  // Create product image
  .post(
    "/",
    async ({ body }) => {
      try {
        const imageId = await ProductImageService.createImage({
          ...body,
          display_order: body.display_order ?? null,
        });
        return { message: "Product image created", image_id: imageId };
      } catch (error) {
        throw new Error("Failed to create product image");
      }
    },
    {
      body: t.Object({
        product_id: t.Number(),
        image_url: t.String(),
        is_primary: t.Boolean(),
        display_order: t.Optional(t.Number()),
      }),
    }
  )

  // Update product image
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await ProductImageService.updateImage(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Product image update failed");
        return { message: "Product image updated" };
      } catch (error) {
        throw new Error("Failed to update product image");
      }
    },
    {
      body: t.Partial(
        t.Object({
          product_id: t.Number(),
          image_url: t.String(),
          is_primary: t.Boolean(),
          display_order: t.Optional(t.Number()),
        })
      ),
    }
  )

  // Delete product image
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ProductImageService.deleteImage(Number(params.id));
      if (!success) throw new Error("Product image deletion failed");
      return { message: "Product image deleted" };
    } catch (error) {
      throw new Error("Failed to delete product image");
    }
  });

export default productImageController;
