import { BlogCategoryModel } from "../models/BlogCategoryModel";
import db from "@/core/database";

class BlogCategoryService {
  // Get all blog categories
  async getAllCategories(): Promise<BlogCategoryModel[]> {
    const query = `SELECT * FROM blog_categories;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as BlogCategoryModel[];
    } catch (error) {
      console.error("Failed to fetch blog categories:", error);
      throw new Error("Failed to fetch blog categories");
    } finally {
      conn.release();
    }
  }

  // Get blog category by ID
  async getCategoryById(
    category_id: number
  ): Promise<BlogCategoryModel | null> {
    const query = `SELECT * FROM blog_categories WHERE category_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: any[] = await conn.query(query, [category_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch blog category:", error);
      throw new Error("Failed to fetch blog category");
    } finally {
      conn.release();
    }
  }

  // Create a new blog category
  async createCategory(
    category: Omit<BlogCategoryModel, "category_id">
  ): Promise<number> {
    const query = `INSERT INTO blog_categories (name, slug, description) VALUES (?, ?, ?);`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        category.name,
        category.slug,
        category.description,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create blog category:", error);
      throw new Error("Failed to create blog category");
    } finally {
      conn.release();
    }
  }

  // Update blog category
  async updateCategory(
    category_id: number,
    category: Partial<Omit<BlogCategoryModel, "category_id">>
  ): Promise<boolean> {
    const query = `UPDATE blog_categories SET name = ?, slug = ?, description = ? WHERE category_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        category.name,
        category.slug,
        category.description,
        category_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update blog category:", error);
      throw new Error("Failed to update blog category");
    } finally {
      conn.release();
    }
  }

  // Delete blog category
  async deleteCategory(category_id: number): Promise<boolean> {
    const query = `DELETE FROM blog_categories WHERE category_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [category_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete blog category:", error);
      throw new Error("Failed to delete blog category");
    } finally {
      conn.release();
    }
  }
}

export default new BlogCategoryService();
