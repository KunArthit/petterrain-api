import { Elysia, t } from "elysia";
import ProductService from "../classes/ProductsClass";

const productController = new Elysia({
  prefix: "/products",
  tags: ["Products"],
})
  // Get all products
  .get("/", async ({ query }) => {
    try {
      if (query?.q) {
        return await ProductService.searchProducts(query.q);
      }
      return await ProductService.getAllProducts();
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }
  })

  .get("/:id", async ({ params }: { params: { id: string } }) => {
    try {
      const product = await ProductService.getProductById(Number(params.id));
      if (!product) throw new Error("Product not found");
      return product;
    } catch (error) {
      console.error("Error fetching product by ID:", error); // 🛠 เพิ่ม log
      throw new Error("Failed to fetch product");
    }
  })

  // Create product
  // .post(
  //   "/",
  //   async ({ body }: { body: any }, ctx: { status: number }) => {
  //     try {
  //       const productId = await ProductService.createProduct(body);
  //       return { message: "Product created", product_id: productId };
  //     } catch (error) {
  //       // Check for duplicate entry error from MySQL
  //       if ((error as any).code === "ER_DUP_ENTRY") {
  //         // Extract the duplicate value from the error message
  //         const duplicateValue =
  //           (error as any).sqlMessage.match(
  //             /Duplicate entry '(.+?)' for/
  //           )?.[1] || "value";

  //         // Check which key was duplicated
  //         if ((error as any).sqlMessage.includes("for key 'products.sku'")) {
  //           ctx.status = 409; // Conflict status code
  //           return {
  //             error: "Duplicate SKU error",
  //             message: `The SKU "${duplicateValue}" is already in use. Please provide a unique SKU.`,
  //             code: (error as any).code,
  //             sqlMessage: (error as any).sqlMessage,
  //           };
  //         }

  //         // Generic duplicate error for other fields
  //         ctx.status = 409; // Conflict status code
  //         return {
  //           error: "Duplicate value error",
  //           message: `The ${duplicateValue} already exists.`,
  //           code: (error as any).code,
  //           sqlMessage: (error as any).sqlMessage,
  //         };
  //       }

  //       // Handle other database errors
  //       if ((error as any).sqlMessage) {
  //         ctx.status = 400; // Bad Request
  //         return {
  //           error: "Database error",
  //           message: "Failed to create product due to a database error.",
  //           code: (error as any).code,
  //           sqlMessage: (error as any).sqlMessage,
  //         };
  //       }

  //       // Handle all other errors
  //       ctx.status = 500; // Internal Server Error
  //       return {
  //         error: "Server error",
  //         message: "Failed to create product due to an unexpected error.",
  //         originalError: (error as Error).message,
  //       };
  //     }
  //   },
  //   {
  //     body: t.Object({
  //       category_id: t.Number(),
  //       product_category_id: t.Number(),
  //       name: t.String(),
  //       sku: t.String(),
  //       description: t.String(),
  //       short_description: t.String(),
  //       price: t.Number(),
  //       sale_price: t.Optional(t.Number()),
  //       stock_quantity: t.Optional(t.Number()),
  //       is_featured: t.Optional(t.Boolean()),
  //       is_active: t.Optional(t.Boolean()),
  //     }),
  //   }
  // )

  .post(
    "/",
    async ({ body, set }) => {
      try {
        // ส่ง body ทั้งก้อนไปให้ Service จัดการ
        const productId = await ProductService.createProduct(body);
        set.status = 201; // Created
        return {
          message: "Product created successfully",
          product_id: productId,
        };
      } catch (error) {
        // --- การจัดการ Error ที่มีอยู่แล้ว สามารถใช้ต่อได้ ---
        // ตรวจจับ Duplicate Entry Error จาก MySQL
        if ((error as any).code === "ER_DUP_ENTRY") {
          const duplicateValue =
            (error as any).sqlMessage.match(
              /Duplicate entry '(.+?)' for/
            )?.[1] || "value";

          if ((error as any).sqlMessage.includes("for key 'products.sku'")) {
            set.status = 409; // Conflict
            return {
              error: "Duplicate SKU",
              message: `The SKU "${duplicateValue}" is already in use. Please provide a unique SKU.`,
            };
          }
          // จัดการ duplicate error อื่นๆ ถ้ามี
          set.status = 409;
          return {
            error: "Duplicate value",
            message: `The value "${duplicateValue}" already exists.`,
          };
        }

        // จัดการ Foreign Key Error
        if ((error as any).code === "ER_NO_REFERENCED_ROW_2") {
          set.status = 400; // Bad Request
          return {
            message: `Invalid category_id: ${body.category_id}. Category does not exist.`,
          };
        }

        // จัดการ Database errors อื่นๆ
        if ((error as any).sqlMessage) {
          set.status = 400; // Bad Request
          return {
            error: "Database error",
            message: "Failed to create product due to a database error.",
            details: (error as any).sqlMessage,
          };
        }

        // จัดการ Server errors ทั่วไป
        set.status = 500; // Internal Server Error
        return {
          error: "Server error",
          message: "An unexpected error occurred.",
        };
      }
    },
    {
      // --- Schema (Validation) ที่อัปเดตใหม่ ---
      // รับข้อมูลแยกตามภาษา และตัด product_category_id ที่ซ้ำซ้อนออก
      body: t.Object({
        category_id: t.Number(), // ID ของ Solution Category
        product_category_id: t.Optional(t.Number()), // ID ของ Product Category (ทำให้เป็น optional ไปก่อน เผื่อยังใช้งาน)

        // --- ข้อมูลภาษาไทย ---
        name_th: t.String({
          minLength: 1,
          error: "Thai product name is required.",
        }),
        description_th: t.Optional(t.String()),
        short_description_th: t.Optional(t.String()),

        // --- ข้อมูลภาษาอังกฤษ ---
        name_en: t.String({
          minLength: 1,
          error: "English product name is required.",
        }),
        description_en: t.Optional(t.String()),
        short_description_en: t.Optional(t.String()),

        // --- ข้อมูลหลัก ---
        sku: t.String({ minLength: 1, error: "SKU is required." }),
        price: t.Number(),
        sale_price: t.Optional(t.Number()),
        stock_quantity: t.Optional(t.Number()),
        is_featured: t.Optional(t.Boolean()),
        is_active: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update product
  // .put(
  //   "/:id",
  //   async ({ params, body }: { params: { id: string }; body: any }) => {
  //     try {
  //       const success = await ProductService.updateProduct(
  //         Number(params.id),
  //         body
  //       );
  //       if (!success) throw new Error("Product update failed");
  //       return { message: "Product updated" };
  //     } catch (error) {
  //       throw new Error("Failed to update product");
  //     }
  //   },
  //   {
  //     body: t.Object({
  //       category_id: t.Number(),
  //       product_category_id: t.Number(),
  //       name: t.String(),
  //       sku: t.String(),
  //       description: t.String(),
  //       short_description: t.String(),
  //       price: t.Number(),
  //       sale_price: t.Optional(t.Number()),
  //       stock_quantity: t.Optional(t.Number()),
  //       is_featured: t.Optional(t.Boolean()),
  //       is_active: t.Optional(t.Boolean()),
  //     }),
  //   }
  // )

  .put(
    "/:id",
    async ({ params, body }: { params: { id: string }; body: any }) => {
      try {
        const success = await ProductService.updateProduct(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Product update failed");
        return { message: "Product updated" };
      } catch (error) {
        throw new Error("Failed to update product");
      }
    },
    {
      body: t.Object({
        category_id: t.Number(),
        product_category_id: t.Number(),
        name: t.String(),
        sku: t.String(),
        description: t.String(),
        short_description: t.String(),
        price: t.Number(),
        sale_price: t.Optional(t.Number()),
        stock_quantity: t.Optional(t.Number()),
        is_featured: t.Optional(t.Boolean()),
        is_active: t.Optional(t.Boolean()),
      }),
    }
  )

  .patch(
    "/:id",
    async (
      { params, body }: { params: { id: string }; body: any },
      ctx: { status: number }
    ) => {
      try {
        const productId = Number(params.id);

        // ตรวจสอบว่า body มีข้อมูลที่จะอัปเดตหรือไม่
        // (Elysia validation จัดการให้แล้ว แต่เผื่อไว้)
        if (Object.keys(body).length === 0) {
          ctx.status = 400; // Bad Request
          return { error: "Empty request body. Nothing to update." };
        }

        const success = await ProductService.patchProduct(productId, body);

        if (success) {
          return {
            message: `Product with ID ${productId} was patched successfully.`,
          };
        } else {
          // กรณีที่ไม่พบ Product ID หรือไม่มีการเปลี่ยนแปลงข้อมูล
          ctx.status = 404; // Not Found
          return {
            error: `Product with ID ${productId} not found or no changes were made.`,
          };
        }
      } catch (error: any) {
        console.error(`Error patching product with ID ${params.id}:`, error);
        ctx.status = 500; // Internal Server Error
        return {
          error: "Failed to patch product due to a server error.",
          details: error.message,
        };
      }
    },
    {
      // ✅ --- Validation Schema สำหรับ PATCH --- ✅
      // ทุกฟิลด์ต้องเป็น Optional เพราะ Client อาจส่งมาแค่ฟิลด์เดียวหรือหลายฟิลด์ก็ได้
      body: t.Object(
        {
          category_id: t.Optional(t.Number()),
          sku: t.Optional(t.String()),
          price: t.Optional(t.Number()),
          sale_price: t.Optional(t.Number()),
          stock_quantity: t.Optional(t.Number()),
          is_featured: t.Optional(t.Boolean()),
          is_active: t.Optional(t.Boolean()),
          // --- ไม่ต้องมีฟิลด์เกี่ยวกับภาษา (name, description) ที่นี่ ---
        },
        {
          // กำหนดให้ body ต้องมีอย่างน้อย 1 property
          minProperties: 1,
          error: "Request body cannot be empty for a PATCH request.",
        }
      ),
    }
  )

  // Delete product
  .delete("/:id", async ({ params }: { params: { id: string } }) => {
    try {
      const success = await ProductService.deleteProduct(Number(params.id));
      if (!success) throw new Error("Product deletion failed");
      return { message: "Product deleted" };
    } catch (error) {
      throw new Error("Failed to delete product");
    }
  })

  // Add or update product image
  .put(
    "/:id/image",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: { image_url: string };
    }) => {
      try {
        const productId = Number(params.id);

        if (!body.image_url) {
          throw new Error("Image URL is required");
        }

        const updated = await ProductService.updateProductImage(
          productId,
          body.image_url
        );

        if (!updated) {
          throw new Error("Failed to update product image");
        }

        return { message: "Product image updated" };
      } catch (error) {
        console.error("Error updating product image:", error);
        throw new Error("Failed to update product image");
      }
    },
    {
      body: t.Object({
        image_url: t.String({ format: "uri" }), // you can change validation as needed
      }),
    }
  )
  // Add additional image
  .post(
    "/:id/images",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: { image_url: string };
    }) => {
      try {
        const productId = Number(params.id);

        if (!body.image_url) {
          throw new Error("Image URL is required");
        }

        const added = await ProductService.addProductImage(
          productId,
          body.image_url
        );

        if (!added) {
          throw new Error("Failed to add product image");
        }

        return { message: "Product image added" };
      } catch (error) {
        console.error("Error adding product image:", error);
        throw new Error("Failed to add product image");
      }
    },
    {
      body: t.Object({
        image_url: t.String({ format: "uri" }),
      }),
    }
  )
  .delete(
    "/:id/images",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: { image_url: string };
    }) => {
      try {
        const productId = Number(params.id);

        if (!body.image_url) {
          throw new Error("Image URL is required");
        }

        const deleted = await ProductService.deleteProductImage(
          productId,
          body.image_url
        );

        if (!deleted) {
          throw new Error("Image not found or already deleted");
        }

        return { message: "Product image deleted successfully" };
      } catch (error) {
        console.error("Error deleting product image:", error);
        throw new Error("Failed to delete product image");
      }
    },
    {
      body: t.Object({
        image_url: t.String(),
      }),
    }
  );
export default productController;
