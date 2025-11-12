import { ProductModel } from "../models/ProductsModel";
import db from "@/core/database";
import { RowDataPacket, FieldPacket, ResultSetHeader } from "mysql2";

export interface StockUpdateResult {
  product_id: number;
  previous_stock: number;
  new_stock: number;
  quantity_reduced: number;
}

class ProductService {
  // Get all products with both solution and product category
  async getAllProducts(): Promise<ProductModel[]> {
    const query = `
            SELECT
            p.product_id,
            pi.image_url AS image,
            pt.name AS product_name,
            
            sct.name AS solution_category_name, 
            
            p.category_id AS solution_category_id,
            
            pct.name AS product_category_name, 
            
            p.stock_quantity,
            p.sale_price AS price,
            p.is_featured,
            CASE
                WHEN p.is_active = 1 THEN 'Active'
                ELSE 'Inactive'
            END AS action
        FROM products p

        LEFT JOIN products_translations pt ON p.product_id = pt.product_id 

        LEFT JOIN solution_categories_translations sct
            ON p.category_id = sct.solution_category_id 
            AND pt.lang = sct.lang 

        LEFT JOIN product_categories_translations pct 
            ON p.product_category_id = pct.product_category_id 
            AND pt.lang = pct.lang

        LEFT JOIN (
            SELECT product_id, MIN(image_url) AS image_url
            FROM product_images
            GROUP BY product_id
        ) pi ON p.product_id = pi.product_id;
    `;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ProductModel[];
    } catch (error) {
      console.error("Failed to fetch products:", error);
      throw new Error("Failed to fetch products");
    } finally {
      conn.release();
    }
  }

  // Search products by name or category
  async searchProducts(keyword: string): Promise<ProductModel[]> {
    const query = `
      SELECT 
        p.product_id AS product_id,
        COALESCE(pi.image_url, '') AS image,
        p.name AS product_name,
        sc.name AS solution_category_name,
        sc.category_id AS solution_category_id,
        pc.name AS product_category_name,
        p.stock_quantity,
        p.price AS price,
        p.is_featured,
        CASE 
            WHEN p.is_active = 1 THEN 'Active'
            ELSE 'Inactive'
        END AS action
      FROM products p
      LEFT JOIN solution_categories sc ON p.category_id = sc.category_id
      LEFT JOIN product_categories pc ON p.product_category_id = pc.category_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      WHERE p.name LIKE ? OR sc.name LIKE ? OR pc.name LIKE ?;
    `;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
      ]);
      return rows as ProductModel[];
    } catch (error) {
      console.error("Failed to search products:", error);
      throw new Error("Failed to search products");
    } finally {
      conn.release();
    }
  }

  // Get product by ID
  // async getProductById(product_id: number): Promise<ProductModel | null> {
  //   const query = `
  //    SELECT
  //       p.product_id,
  //       p.category_id,
  //       pt.lang,
  //       pt.name AS name,
  //       p.sku,
  //       pt.description,
  //       pt.short_description,
  //       p.price,
  //       p.sale_price,
  //       p.stock_quantity,
  //       p.is_featured,
  //       p.is_active,
  //       p.created_at,
  //       p.updated_at,
  //       (
  //         SELECT GROUP_CONCAT(DISTINCT image_url)
  //         FROM product_images
  //         WHERE product_id = p.product_id
  //       ) AS image_urls,
  //       (
  //         SELECT GROUP_CONCAT(DISTINCT video_id ORDER BY display_order)
  //         FROM product_videos
  //         WHERE product_id = p.product_id
  //       ) AS video_ids,
  //       (
  //         SELECT GROUP_CONCAT(DISTINCT video_url ORDER BY display_order)
  //         FROM product_videos
  //         WHERE product_id = p.product_id
  //       ) AS video_urls,
  //       (
  //         SELECT GROUP_CONCAT(DISTINCT video_type ORDER BY display_order)
  //         FROM product_videos
  //         WHERE product_id = p.product_id
  //       ) AS video_types,
  //       sct.name AS solution_category_name,
  //       sc.category_id AS solution_category_id,
  //       pc.name AS product_category_name,
  //       CASE
  //         WHEN p.is_active = 1 THEN 'Active'
  //         ELSE 'Inactive'
  //       END AS action
  //     FROM products p
  //     LEFT JOIN products_translations pt
  //       ON pt.product_id = p.product_id   -- ✅ ต้องมาก่อน sct
  //     LEFT JOIN solution_categories sc
  //       ON p.category_id = sc.category_id
  //     LEFT JOIN solution_categories_translations sct
  //       ON sc.category_id = sct.solution_category_id
  //       AND sct.lang = pt.lang            -- ✅ ตอนนี้อ้างอิงได้ถูกต้องแล้ว
  //     LEFT JOIN product_categories pc
  //       ON p.product_category_id = pc.category_id
  //     WHERE p.product_id = 6
  //     ORDER BY pt.lang;
  //     `;

  //   const conn = await db.getConnection();
  //   try {
  //     const [rows]: [RowDataPacket[], FieldPacket[]] = await conn.query(query, [
  //       product_id,
  //     ]);
  //     if (!rows.length) return null;

  //     const row = rows[0];

  //     const baseData: ProductModel = {
  //       product_id: row.product_id,
  //       category_id: row.category_id,
  //       product_category_id: row.product_category_id,
  //       name: row.name,
  //       sku: row.sku,
  //       description: row.description,
  //       short_description: row.short_description,
  //       price: row.price,
  //       sale_price: row.sale_price,
  //       stock_quantity: row.stock_quantity,
  //       is_featured: row.is_featured,
  //       is_active: row.is_active,
  //       created_at: row.created_at,
  //       updated_at: row.updated_at,
  //       solution_category_name: row.solution_category_name,
  //       solution_category_id: row.solution_category_id,
  //       product_category_name: row.product_category_name,
  //       action: row.action,
  //       images: row.image_urls ? row.image_urls.split(",") : [],
  //       videos:
  //         row.video_urls && row.video_types && row.video_ids
  //           ? row.video_urls.split(",").map((url: string, idx: number) => ({
  //               id: row.video_ids.split(",")[idx] ?? null,
  //               url,
  //               type: row.video_types.split(",")[idx] ?? "unknown",
  //             }))
  //           : [],
  //     };

  //     return baseData;
  //   } catch (error) {
  //     console.error("Failed to fetch product:", error);
  //     throw new Error("Failed to fetch product");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async getProductById(product_id: number): Promise<ProductModel[] | null> {
    const query = `
    SELECT 
      p.product_id,
      p.category_id,
      pt.lang,
      pt.name AS name,
      p.sku,
      pt.description,
      pt.short_description,
      p.price,
      p.sale_price,
      p.stock_quantity,
      p.is_featured,
      p.is_active,
      p.created_at,
      p.updated_at,
      (
        SELECT GROUP_CONCAT(DISTINCT image_url)
        FROM product_images
        WHERE product_id = p.product_id
      ) AS image_urls,
      (
        SELECT GROUP_CONCAT(DISTINCT video_id ORDER BY display_order)
        FROM product_videos
        WHERE product_id = p.product_id
      ) AS video_ids,
      (
        SELECT GROUP_CONCAT(DISTINCT video_url ORDER BY display_order)
        FROM product_videos
        WHERE product_id = p.product_id
      ) AS video_urls,
      (
        SELECT GROUP_CONCAT(DISTINCT video_type ORDER BY display_order)
        FROM product_videos
        WHERE product_id = p.product_id
      ) AS video_types,
      sct.name AS solution_category_name,
      sc.category_id AS solution_category_id,
      pc.name AS product_category_name,
      CASE 
        WHEN p.is_active = 1 THEN 'Active'
        ELSE 'Inactive'
      END AS action
    FROM products p
    LEFT JOIN products_translations pt 
      ON pt.product_id = p.product_id
    LEFT JOIN solution_categories sc 
      ON p.category_id = sc.category_id
    LEFT JOIN solution_categories_translations sct
      ON sc.category_id = sct.solution_category_id
      AND sct.lang = pt.lang
    LEFT JOIN product_categories pc 
      ON p.product_category_id = pc.category_id
    WHERE p.product_id = ?
    ORDER BY pt.lang;
  `;

    const conn = await db.getConnection();
    try {
      const [rows]: [RowDataPacket[], FieldPacket[]] = await conn.query(query, [
        product_id,
      ]);
      if (!rows.length) return null;

      // ✅ แปลงแต่ละภาษาเป็น object แยก
      const products: ProductModel[] = rows.map((row) => ({
        product_id: row.product_id,
        category_id: row.category_id,
        lang: row.lang, // เพิ่มภาษา
        product_category_id: row.product_category_id,
        name: row.name,
        sku: row.sku,
        description: row.description,
        short_description: row.short_description,
        price: row.price,
        sale_price: row.sale_price,
        stock_quantity: row.stock_quantity,
        is_featured: row.is_featured,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        solution_category_name: row.solution_category_name,
        solution_category_id: row.solution_category_id,
        product_category_name: row.product_category_name,
        action: row.action,
        images: row.image_urls ? row.image_urls.split(",") : [],
        videos:
          row.video_urls && row.video_types && row.video_ids
            ? row.video_urls.split(",").map((url: string, idx: number) => ({
                id: row.video_ids.split(",")[idx] ?? null,
                url,
                type: row.video_types.split(",")[idx] ?? "unknown",
              }))
            : [],
      }));

      return products;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      throw new Error("Failed to fetch product");
    } finally {
      conn.release();
    }
  }

  // Create new product
  // async createProduct(
  //   product: Omit<ProductModel, "product_id" | "created_at" | "updated_at">
  // ): Promise<number> {
  //   const query = `
  //     INSERT INTO products (category_id, product_category_id, name, sku, description, short_description, price, sale_price, stock_quantity, is_featured, is_active)
  //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  //   `;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [
  //       product.category_id,
  //       product.product_category_id,
  //       product.name,
  //       product.sku,
  //       product.description,
  //       product.short_description,
  //       product.price,
  //       product.sale_price,
  //       product.stock_quantity,
  //       product.is_featured,
  //       product.is_active,
  //     ]);
  //     return (result as any).insertId;
  //   } catch (error) {
  //     console.error("Failed to create product:", error);
  //     throw new Error("Failed to create product");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async createProduct(productData: any): Promise<number> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. เพิ่มข้อมูลหลักลงในตาราง `products`
      //    (ข้อมูลที่ไม่เกี่ยวกับภาษา)
      const productQuery = `
        INSERT INTO products (
          category_id,
          name,
          description,
          short_description,
          sku, 
          price, 
          sale_price, 
          stock_quantity, 
          is_featured, 
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      const [productResult] = await conn.query(productQuery, [
        productData.category_id,
        productData.name_th,
        productData.description_th || "",
        productData.short_description_th || "",
        productData.sku,
        productData.price,
        productData.sale_price || null,
        productData.stock_quantity || 0,
        productData.is_featured || false,
        productData.is_active || true,
      ]);

      const productId = (productResult as any).insertId;
      if (!productId) {
        throw new Error("Failed to create product, could not get product ID.");
      }

      // 2. เพิ่มข้อมูลภาษาไทยลงในตาราง `product_translations`
      //    ตารางนี้มีคอลัมน์: product_id, lang, name, description, short_description
      const thTranslationQuery = `
        INSERT INTO products_translations (product_id, lang, name, description, short_description)
        VALUES (?, 'th', ?, ?, ?);
      `;
      await conn.query(thTranslationQuery, [
        productId,
        productData.name_th,
        productData.description_th || "",
        productData.short_description_th || "",
      ]);

      // 3. เพิ่มข้อมูลภาษาอังกฤษลงในตาราง `product_translations`
      const enTranslationQuery = `
        INSERT INTO products_translations (product_id, lang, name, description, short_description)
        VALUES (?, 'en', ?, ?, ?);
      `;
      await conn.query(enTranslationQuery, [
        productId,
        productData.name_en,
        productData.description_en || "",
        productData.short_description_en || "",
      ]);

      // --- ถ้าทุกอย่างสำเร็จ ให้ commit transaction ---
      await conn.commit();

      return productId;
    } catch (error) {
      // --- ถ้ามีข้อผิดพลาดเกิดขึ้น ให้ rollback ---
      await conn.rollback();
      console.error("Failed to create product with translations:", error);
      // โยน error กลับไปให้ Controller จัดการและส่ง response ที่เหมาะสม
      throw error;
    } finally {
      conn.release();
    }
  }

  // Update product
  // async updateProduct(productId: number, body: any): Promise<boolean> {
  //   const conn = await db.getConnection();
  //   try {
  //     await conn.beginTransaction();

  //     // 1. Update the main product table
  //     const productQuery = `
  //           UPDATE products
  //           SET sku=?, price=?, sale_price=?, stock_quantity=?, is_featured=?, is_active=?, category_id=?
  //           WHERE product_id=?;
  //       `;
  //     await conn.query(productQuery, [
  //       body.sku,
  //       body.price,
  //       body.sale_price,
  //       body.stock_quantity,
  //       body.is_featured,
  //       body.is_active,
  //       body.category_id,
  //       productId,
  //     ]);

  //     console.log(body);

  //     // 2. Update/Insert the translation table
  //     const lang = body.lang || "th"; // Assume language is 'th' if not provided
  //     const translationQuery = `
  //           INSERT INTO products_translations (product_id, lang, name, description, short_description)
  //           VALUES (?, ?, ?, ?, ?)
  //           ON DUPLICATE KEY UPDATE
  //               name = VALUES(name),
  //               description = VALUES(description),
  //               short_description = VALUES(short_description);
  //       `;
  //     await conn.query(translationQuery, [
  //       productId,
  //       lang,
  //       body.name,
  //       body.description,
  //       body.short_description,
  //     ]);

  //     await conn.commit();
  //     return true;
  //   } catch (error) {
  //     await conn.rollback();
  //     console.error("Failed to update product:", error);
  //     throw error; // Re-throw the original error
  //   } finally {
  //     conn.release();
  //   }
  // }

  async updateProduct(productId: number, body: any): Promise<boolean> {
    // ใช้ Destructuring เพื่อให้โค้ดสะอาดและอ่านง่ายขึ้น
    const {
      sku,
      price,
      sale_price,
      stock_quantity,
      is_featured,
      is_active,
      category_id,
      product_category_id,
      name,
      description,
      short_description,
    } = body;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const isThai = (text:any) => {
        if (typeof text !== "string") return false;
        // Regular expression to find any Thai character
        const thaiRegex = /[\u0E00-\u0E7F]/;
        return thaiRegex.test(text);
      };

      // 1. อัปเดตตารางหลัก products (ส่วนนี้ถูกต้องแล้ว)
      const productQuery = `
            UPDATE products 
            SET 
                sku = ?, 
                price = ?, 
                sale_price = ?, 
                stock_quantity = ?, 
                is_featured = ?, 
                is_active = ?, 
                category_id = ?, 
                product_category_id = ?
            WHERE product_id = ?;
        `;
      await conn.query(productQuery, [
        sku,
        price,
        sale_price,
        stock_quantity,
        is_featured,
        is_active,
        category_id,
        product_category_id,
        productId,
      ]);

      // 2. ตรวจสอบภาษาและอัปเดต/เพิ่มข้อมูลในตาราง products_translations
      let lang;
      if (body.lang) {
        // ถ้ามีการส่ง lang มาจาก frontend ให้ใช้ค่านั้น
        lang = body.lang;
      } else {
        // ถ้าไม่ได้ส่งมา ให้ตรวจสอบจาก 'name' ที่ส่งมา
        lang = isThai(name) ? "th" : "en";
        console.log(
          `Language not provided, detected as '${lang}' from product name.`
        );
      }

      const translationQuery = `
            UPDATE products_translations 
            SET 
                name = ?, 
                description = ?, 
                short_description = ?
            WHERE product_id = ? AND lang = ?;
        `;

      // รับผลลัพธ์จากการ query เพื่อตรวจสอบ affectedRows
      const [updateResult]:any = await conn.query(translationQuery, [
        name,
        description,
        short_description,
        productId,
        lang,
      ]);

      // ตรวจสอบว่ามีการอัปเดตแถวข้อมูลหรือไม่
      if (updateResult.affectedRows === 0) {
        // ถ้าไม่มีข้อมูลเดิม, ให้ INSERT ข้อมูลใหม่เข้าไป
        console.log(
          `Translation for lang='${lang}' not found, inserting new one.`
        );
        const insertQuery = `
                INSERT INTO products_translations (product_id, lang, name, description, short_description)
                VALUES (?, ?, ?, ?, ?);
            `;
        await conn.query(insertQuery, [
          productId,
          lang,
          name,
          description,
          short_description,
        ]);
      } else {
        console.log(`Successfully updated translation for lang='${lang}'.`);
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to update product:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async patchProduct(productId: number, body: Partial<any>): Promise<boolean> {
    // 1. กำหนดรายชื่อฟิลด์ที่อนุญาตให้อัปเดตผ่าน PATCH ได้ เพื่อความปลอดภัย
    const allowedFields = [
      "category_id",
      "sku",
      "price",
      "sale_price",
      "stock_quantity",
      "is_featured",
      "is_active",
    ];

    // 2. กรองเอาเฉพาะ key จาก body ที่มีอยู่ใน allowedFields
    const fieldsToUpdate: any = Object.keys(body).filter((key) =>
      allowedFields.includes(key)
    );

    // 3. ถ้าไม่มีฟิลด์ที่ตรงเงื่อนไขเลย ก็ไม่ต้องทำอะไรต่อ
    if (fieldsToUpdate.length === 0) {
      console.warn(
        "PatchProduct called with no valid fields to update. Body:",
        body
      );
      // คืนค่า false เพราะไม่มีการอัปเดตเกิดขึ้น
      return false;
    }

    const conn = await db.getConnection();
    try {
      // 4. สร้างส่วน SET ของ SQL Query แบบ Dynamic
      // ตัวอย่าง: "SET is_active = ?, is_featured = ?"
      const setClause = fieldsToUpdate
        .map((field:any) => `${field} = ?`)
        .join(", ");

      // 5. สร้าง Query ทั้งหมด โดยเพิ่มการอัปเดต updated_at เข้าไปด้วย
      const query = `
        UPDATE products 
        SET ${setClause}, updated_at = NOW() 
        WHERE product_id = ?;
      `;

      // 6. สร้าง Array ของค่าที่จะใส่ใน Query ให้ตรงกับลำดับของ placeholder (?)
      const values = [
        ...fieldsToUpdate.map((field:any) => body[field as keyof typeof body]), // ค่าจาก body
        productId, // ค่าสุดท้ายสำหรับ WHERE clause
      ];

      const [result] = await conn.query(query, values);

      // 7. ตรวจสอบว่ามีการอัปเดตแถวข้อมูลจริงหรือไม่ (affectedRows > 0)
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error(`Failed to patch product with ID ${productId}:`, error);
      // โยน error กลับไปให้ Controller จัดการ
      throw error;
    } finally {
      // 8. คืน Connection กลับสู่ Pool ไม่ว่าจะสำเร็จหรือล้มเหลว
      conn.release();
    }
  }

  // Delete product
  async deleteProduct(product_id: number): Promise<boolean> {
    const query = `DELETE FROM products WHERE product_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [product_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw new Error("Failed to delete product");
    } finally {
      conn.release();
    }
  }

  async addProductImage(
    product_id: number,
    image_url: string,
    is_primary = false,
    display_order: number = 0
  ): Promise<boolean> {
    const conn = await db.getConnection();

    try {
      const query = `
        INSERT INTO product_images (
          product_id,
          image_url,
          is_primary,
          display_order
        )
        VALUES (?, ?, ?, ?);
      `;

      const [result] = await conn.query(query, [
        product_id,
        image_url,
        is_primary ? 1 : 0,
        display_order,
      ]);

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to add product image:", error);
      throw new Error("Failed to add product image");
    } finally {
      conn.release();
    }
  }

  async updateProductImage(
    product_id: number,
    image_url: string
  ): Promise<boolean> {
    const conn = await db.getConnection();

    try {
      const query = `
        INSERT INTO product_images (
          product_id,
          image_url,
          is_primary,
          display_order,
        )
        VALUES (?, ?, 1, 0, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          image_url = VALUES(image_url);
      `;

      const [result] = await conn.query(query, [product_id, image_url]);

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update product image:", error);
      throw new Error("Failed to update product image");
    } finally {
      conn.release();
    }
  }

  async deleteProductImage(
    product_id: number,
    image_url: string
  ): Promise<boolean> {
    const conn = await db.getConnection();

    try {
      const query = `
        DELETE FROM product_images
        WHERE product_id = ? AND image_url = ?;
      `;

      const [result] = await conn.query(query, [product_id, image_url]);

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete product image:", error);
      throw new Error("Failed to delete product image");
    } finally {
      conn.release();
    }
  }

  /**
   * Reduce stock quantity for a product
   */
  async reduceStockQuantity(
    product_id: number,
    quantity: number
  ): Promise<StockUpdateResult> {
    try {
      // First, get current stock
      const currentStock = await this.getStockQuantity(product_id);

      if (currentStock < quantity) {
        throw new Error(
          `Insufficient stock for product ID: ${product_id}. Available: ${currentStock}, Required: ${quantity}`
        );
      }

      // Update stock quantity - using correct column names
      const query = `
        UPDATE products 
        SET stock_quantity = stock_quantity - ?, updated_at = NOW() 
        WHERE product_id = ? AND stock_quantity >= ?
      `;

      const result = await db.execute(query, [quantity, product_id, quantity]);

      // Check if any rows were affected
      const [queryResult] = result;
      const { affectedRows } = queryResult as ResultSetHeader;
      if (affectedRows === 0) {
        throw new Error(
          `Failed to reduce stock for product ID: ${product_id}. Possible concurrent stock update.`
        );
      }

      const newStock = currentStock - quantity;

      console.log(
        `📦 Reduced stock for product ${product_id}: ${currentStock} → ${newStock} (-${quantity})`
      );

      return {
        product_id,
        previous_stock: currentStock,
        new_stock: newStock,
        quantity_reduced: quantity,
      };
    } catch (error) {
      console.error(
        `❌ Error reducing stock for product ${product_id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get current stock quantity for a product
   */
  async getStockQuantity(product_id: number): Promise<number> {
    try {
      const query = `SELECT stock_quantity FROM products WHERE product_id = ?`;
      const [rows] = await db.execute(query, [product_id]);

      if (
        !(rows as RowDataPacket[]) ||
        (rows as RowDataPacket[]).length === 0
      ) {
        throw new Error(`Product not found: ${product_id}`);
      }

      return (rows as RowDataPacket[])[0].stock_quantity || 0;
    } catch (error) {
      console.error(
        `❌ Error fetching stock for product ${product_id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if sufficient stock is available
   */
  async checkStockAvailability(
    product_id: number,
    required_quantity: number
  ): Promise<boolean> {
    try {
      const currentStock = await this.getStockQuantity(product_id);
      return currentStock >= required_quantity;
    } catch (error) {
      console.error(
        `❌ Error checking stock availability for product ${product_id}:`,
        error
      );
      return false;
    }
  }

  /**
   * Reduce stock for multiple products (batch operation)
   */
  async reduceStockForMultipleProducts(
    items: Array<{ product_id: number; quantity: number }>
  ): Promise<StockUpdateResult[]> {
    const results: StockUpdateResult[] = [];

    // Validate all stock levels first
    for (const item of items) {
      const available = await this.checkStockAvailability(
        item.product_id,
        item.quantity
      );
      if (!available) {
        const currentStock = await this.getStockQuantity(item.product_id);
        throw new Error(
          `Insufficient stock for product ID: ${item.product_id}. Available: ${currentStock}, Required: ${item.quantity}`
        );
      }
    }

    // If all validations pass, reduce stock for all items
    for (const item of items) {
      const result = await this.reduceStockQuantity(
        item.product_id,
        item.quantity
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Restore stock quantity (for refunds or failed payments)
   * Fixed: Use correct column names
   */
  async restoreStockQuantity(
    product_id: number,
    quantity: number
  ): Promise<void> {
    try {
      const query = `
        UPDATE products 
        SET stock_quantity = stock_quantity + ?, updated_at = NOW() 
        WHERE product_id = ?
      `;

      const result = await db.execute(query, [quantity, product_id]);

      const [queryResult] = result;
      if ((queryResult as ResultSetHeader).affectedRows === 0) {
        throw new Error(`Product not found: ${product_id}`);
      }

      console.log(`📦 Restored stock for product ${product_id}: +${quantity}`);
    } catch (error) {
      console.error(
        `❌ Error restoring stock for product ${product_id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get product details including stock
   * Fixed: Use correct column names from your products table
   */
  async getProductDetails(product_id: number) {
    try {
      const query = `
        SELECT product_id, category_id, name, sku, description, short_description,
               price, sale_price, stock_quantity, is_featured, is_active,
               created_at, updated_at, product_category_id
        FROM products 
        WHERE product_id = ?
      `;

      const [rows] = await db.execute(query, [product_id]);
      return (rows as RowDataPacket[])[0] || null;
    } catch (error) {
      console.error(
        `❌ Error fetching product details for ${product_id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get low stock products
   * Fixed: Use correct column names
   */
  async getLowStockProducts(threshold: number = 10) {
    try {
      const query = `
        SELECT product_id, name, sku, stock_quantity, price, sale_price
        FROM products 
        WHERE stock_quantity <= ? AND is_active = 1
        ORDER BY stock_quantity ASC
      `;

      const [rows] = await db.execute(query, [threshold]);
      return rows || [];
    } catch (error) {
      console.error("❌ Error fetching low stock products:", error);
      throw error;
    }
  }

  /**
   * Batch update stock quantities
   * New method: For bulk operations
   */
  async batchUpdateStock(
    updates: Array<{ product_id: number; new_quantity: number }>
  ) {
    try {
      const results = [];

      for (const update of updates) {
        const query = `
          UPDATE products 
          SET stock_quantity = ?, updated_at = NOW() 
          WHERE product_id = ?
        `;

        const result = await db.execute(query, [
          update.new_quantity,
          update.product_id,
        ]);
        results.push({
          product_id: update.product_id,
          updated: (result[0] as ResultSetHeader).affectedRows > 0,
        });
      }

      return results;
    } catch (error) {
      console.error("❌ Error in batch stock update:", error);
      throw error;
    }
  }
}

export default new ProductService();
