import { ProductVideoModel } from "../models/ProductVideoModel";
import db from "@/core/database";

class ProductVideoService {
  // Get all product videos
  async getAllVideos(): Promise<ProductVideoModel[]> {
    const query = `SELECT * FROM product_videos;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ProductVideoModel[];
    } catch (error) {
      console.error("Failed to fetch product videos:", error);
      throw new Error("Failed to fetch product videos");
    } finally {
      conn.release();
    }
  }

  // Get product video by ID
  async getVideoById(video_id: number): Promise<ProductVideoModel | null> {
    const query = `SELECT * FROM product_videos WHERE video_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [video_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch product video:", error);
      throw new Error("Failed to fetch product video");
    } finally {
      conn.release();
    }
  }

  // Get product videos by Product ID
  async getVideosByProductId(product_id: number): Promise<ProductVideoModel[]> {
    const query = `SELECT * FROM product_videos WHERE product_id = ? ORDER BY display_order ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [product_id]);
      return rows as ProductVideoModel[];
    } catch (error) {
      console.error("Failed to fetch product videos by product ID:", error);
      throw new Error("Failed to fetch product videos by product ID");
    } finally {
      conn.release();
    }
  }

  // Create a new product video
  async createVideo(
    video: Omit<ProductVideoModel, "video_id">
  ): Promise<number> {
    const query = `
      INSERT INTO product_videos (product_id, video_url, video_type, display_order)
      VALUES (?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        video.product_id,
        video.video_url,
        video.video_type,
        video.display_order,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create product video:", error);
      throw new Error("Failed to create product video");
    } finally {
      conn.release();
    }
  }

  // Update product video
  async updateVideo(
    video_id: number,
    video: Partial<Omit<ProductVideoModel, "video_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE product_videos
      SET product_id=?, video_url=?, video_type=?, display_order=?
      WHERE video_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        video.product_id,
        video.video_url,
        video.video_type,
        video.display_order,
        video_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update product video:", error);
      throw new Error("Failed to update product video");
    } finally {
      conn.release();
    }
  }

  // Delete product video
  async deleteVideo(video_id: number): Promise<boolean> {
    const query = `DELETE FROM product_videos WHERE video_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [video_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete product video:", error);
      throw new Error("Failed to delete product video");
    } finally {
      conn.release();
    }
  }
}

export default new ProductVideoService();
