import { ProductImageModel } from "../models/ProductImageModel";
import db from "@/core/database";

class ProductImageService {
  // Get all product images
  async getAllImages(): Promise<ProductImageModel[]> {
    const query = `SELECT * FROM product_images;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ProductImageModel[];
    } catch (error) {
      console.error("Failed to fetch product images:", error);
      throw new Error("Failed to fetch product images");
    } finally {
      conn.release();
    }
  }

  // Get image by ID
  async getImageById(image_id: number): Promise<ProductImageModel | null> {
    const query = `SELECT * FROM product_images WHERE image_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [image_id]);
      const images = rows as ProductImageModel[];
      return images.length ? images[0] : null;
    } catch (error) {
      console.error("Failed to fetch product image:", error);
      throw new Error("Failed to fetch product image");
    } finally {
      conn.release();
    }
  }

  // Get images by Product ID
  async getImagesByProductId(product_id: number): Promise<ProductImageModel[]> {
    const query = `SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [product_id]);
      return rows as ProductImageModel[];
    } catch (error) {
      console.error("Failed to fetch product images by product ID:", error);
      throw new Error("Failed to fetch product images by product ID");
    } finally {
      conn.release();
    }
  }

  // Create a new product image
  async createImage(
    image: Omit<ProductImageModel, "image_id">
  ): Promise<number> {
    const query = `
      INSERT INTO product_images (product_id, image_url, is_primary, display_order)
      VALUES (?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        image.product_id,
        image.image_url,
        image.is_primary,
        image.display_order,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create product image:", error);
      throw new Error("Failed to create product image");
    } finally {
      conn.release();
    }
  }

  // Update product image
  async updateImage(
    image_id: number,
    image: Partial<Omit<ProductImageModel, "image_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE product_images
      SET product_id=?, image_url=?, is_primary=?, display_order=?
      WHERE image_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        image.product_id,
        image.image_url,
        image.is_primary,
        image.display_order,
        image_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update product image:", error);
      throw new Error("Failed to update product image");
    } finally {
      conn.release();
    }
  }

  // Delete product image
  async deleteImage(image_id: number): Promise<boolean> {
    const query = `DELETE FROM product_images WHERE image_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [image_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete product image:", error);
      throw new Error("Failed to delete product image");
    } finally {
      conn.release();
    }
  }
}

export default new ProductImageService();
