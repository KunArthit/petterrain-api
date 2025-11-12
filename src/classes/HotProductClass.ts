import { HotProductModel } from "../models/HotProductModel";
import db from "@/core/database";

class HotProductService {
  // Get all hot products
  async getAllHotProducts(): Promise<HotProductModel[]> {
    const query = `
   SELECT 
  p.product_id,
  p.name AS product_name,
  MAX(sc.name) AS solution_category_name,
  MAX(pc.name) AS product_category_name,
  p.stock_quantity,
  p.price,

  -- First image
  (
    SELECT pi.image_url
    FROM product_images pi
    WHERE pi.product_id = p.product_id
    ORDER BY pi.is_primary DESC, pi.display_order ASC
    LIMIT 1
  ) AS image,

  -- Videos
  GROUP_CONCAT(DISTINCT pv.video_id ORDER BY pv.display_order) AS video_ids,
  GROUP_CONCAT(DISTINCT pv.video_url ORDER BY pv.display_order) AS video_urls,
  GROUP_CONCAT(DISTINCT pv.video_type ORDER BY pv.display_order) AS video_types,

  MAX(CASE 
    WHEN p.is_active = 1 THEN 'Active'
    ELSE 'Inactive'
  END) AS action,

  -- Wrap hot product info in aggregate functions
  MAX(hp.display_order) AS hot_display_order,
  MAX(hp.created_at) AS hot_created_at

FROM hot_products hp
JOIN products p ON p.product_id = hp.product_id
LEFT JOIN solution_categories sc ON p.category_id = sc.category_id
LEFT JOIN product_categories pc ON p.product_category_id = pc.category_id
LEFT JOIN product_videos pv ON p.product_id = pv.product_id

GROUP BY p.product_id
ORDER BY hot_display_order ASC;
    `;

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as HotProductModel[];
    } catch (error) {
      console.error("Failed to fetch hot products:", error);
      throw new Error("Failed to fetch hot products");
    } finally {
      conn.release();
    }
  }

  // Get hot product by ID
  async getHotProductById(id: number): Promise<HotProductModel | null> {
    const query = `SELECT * FROM hot_products WHERE id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch hot product:", error);
      throw new Error("Failed to fetch hot product");
    } finally {
      conn.release();
    }
  }

  // Get hot products by Product ID
  async getHotProductsByProductId(
    product_id: number
  ): Promise<HotProductModel[]> {
    const query = `SELECT * FROM hot_products WHERE product_id = ? ORDER BY display_order ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [product_id]);
      return rows as HotProductModel[];
    } catch (error) {
      console.error("Failed to fetch hot products by product ID:", error);
      throw new Error("Failed to fetch hot products by product ID");
    } finally {
      conn.release();
    }
  }

  // Create a new hot product
  async createHotProduct(
    hotProduct: Omit<HotProductModel, "id" | "created_at">
  ): Promise<number> {
    const query = `
      INSERT INTO hot_products (product_id, display_order, created_at)
      VALUES (?, ?, NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        hotProduct.product_id,
        hotProduct.display_order,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create hot product:", error);
      throw new Error("Failed to create hot product");
    } finally {
      conn.release();
    }
  }

  // Update hot product
  async updateHotProduct(
    id: number,
    hotProduct: Partial<Omit<HotProductModel, "id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE hot_products
      SET product_id=?, display_order=?
      WHERE id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        hotProduct.product_id,
        hotProduct.display_order,
        id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update hot product:", error);
      throw new Error("Failed to update hot product");
    } finally {
      conn.release();
    }
  }

  // Delete hot product
  async deleteHotProduct(id: number): Promise<boolean> {
    const query = `DELETE FROM hot_products WHERE id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete hot product:", error);
      throw new Error("Failed to delete hot product");
    } finally {
      conn.release();
    }
  }
}

export default new HotProductService();
