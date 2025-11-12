import { Elysia, t } from "elysia";
import ProductVideoService from "../classes/ProductVideoClass";
import { ProductVideoModel } from "@/models/ProductVideoModel";

const productVideoController = new Elysia({
  prefix: "/product-video",
  tags: ["Product Video"],
})
  // Get all product videos
  .get("/", async () => {
    try {
      return await ProductVideoService.getAllVideos();
    } catch (error) {
      throw new Error("Failed to fetch product videos");
    }
  })

  // Get product video by ID
  .get("/:id", async ({ params }) => {
    try {
      const video = await ProductVideoService.getVideoById(Number(params.id));
      if (!video) throw new Error("Product video not found");
      return video;
    } catch (error) {
      throw new Error("Failed to fetch product video");
    }
  })

  // Get product videos by Product ID
  .get("/product/:product_id", async ({ params }) => {
    try {
      return await ProductVideoService.getVideosByProductId(
        Number(params.product_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch product videos for product");
    }
  })

  // Create product video
  .post(
    "/",
    async ({ body }) => {
      try {
        const videoId = await ProductVideoService.createVideo({
          ...body,
          display_order: body.display_order ?? null,
        });
        return { message: "Product video created", video_id: videoId };
      } catch (error) {
        throw new Error("Failed to create product video");
      }
    },
    {
      body: t.Object({
        product_id: t.Number(),
        video_url: t.String(),
        video_type: t.String(),
        display_order: t.Optional(t.Number()),
      }),
    }
  )

  // Update product video
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<ProductVideoModel, "video_id">>;
    }) => {
      try {
        const success = await ProductVideoService.updateVideo(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Product video update failed");
        return { message: "Product video updated" };
      } catch (error) {
        throw new Error("Failed to update product video");
      }
    }
  )

  // Delete product video
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ProductVideoService.deleteVideo(Number(params.id));
      if (!success) throw new Error("Product video deletion failed");
      return { message: "Product video deleted" };
    } catch (error) {
      throw new Error("Failed to delete product video");
    }
  });

export default productVideoController;
