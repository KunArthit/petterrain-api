import { ProductCategoryModel } from "../models/ProductCatagoriesModel";
import db from "@/core/database";
import { FieldPacket } from "mysql2";

class ProductCategoryService {
  // Get all product categories
  async getAllCategories(): Promise<ProductCategoryModel[]> {
    const query = `SELECT 
                  c.category_id,
                  pct.lang, -- คอลัมน์ที่เป็นปัญหา
                  pct.name,
                  pct.description,
                  c.image_url,
                  c.is_active,
                  c.created_at,
                  c.updated_at,
                  COUNT(p.product_id) AS products_count
              FROM 
                  product_categories c
              LEFT JOIN 
                  products p ON c.category_id = p.category_id
              LEFT JOIN 
                  product_categories_translations pct ON pct.product_category_id = c.category_id
              GROUP BY 
                  c.category_id, 
                  pct.lang,
                  pct.name, 
                  pct.description, 
                  c.image_url, 
                  c.is_active, 
                  c.created_at, 
                  c.updated_at`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ProductCategoryModel[];
    } catch (error) {
      console.error("Failed to fetch product categories:", error);
      throw new Error("Failed to fetch product categories");
    } finally {
      conn.release();
    }
  }

  // Get product category by ID
  async getCategoryById(
    category_id: number
  ): Promise<ProductCategoryModel | null> {
    const query = `SELECT * FROM product_categories WHERE category_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], FieldPacket[]] = await conn.query(query, [
        category_id,
      ]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch product category:", error);
      throw new Error("Failed to fetch product category");
    } finally {
      conn.release();
    }
  }

  // Create a new product category
  // async createCategory(
  //   category: Omit<any, "category_id">
  // ): Promise<number> {
  //   const query = `
  //     INSERT INTO product_categories (name, description, image_url, is_active)
  //     VALUES (?, ?, ?, ?);
  //   `;

  //   const queryLang = `
  //     INSERT INTO product_categories_translations (product_category_id, lang, name, description)
  //     VALUES (?, ?, ?, ?);
  //   `;

  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [
  //       category.name,
  //       category.description,
  //       category.image_url,
  //       category.is_active,
  //     ]);

  //     const [result2] = await conn.query(query, [
  //       category.nameEn,
  //       category.descriptionEn,
  //     ]);
  //     return (result as any).insertId;
  //   } catch (error) {
  //     console.error("Failed to create product category:", error);
  //     throw new Error("Failed to create product category");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async createCategory(category: Omit<any, "category_id">): Promise<number> {
    const insertBaseSql = `
    INSERT INTO product_categories (name, description, image_url, is_active)
    VALUES (?, ?, ?, ?);
  `;

    const insertTransSql = `
    INSERT INTO product_categories_translations (product_category_id, lang, name, description)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description);
  `;
    // ^ ถ้ามี unique index ที่ (product_category_id, lang) จะ upsert ได้
    // ถ้าไม่มี unique index ให้ตัด ON DUPLICATE KEY UPDATE ออก

    const conn = await db.getConnection();
    try {
      // await conn.beginTransaction(); แปลกภาษาไม่ได้
      // เพราะจะทำให้การ insert หลักล้มทั้งแถว
      // ต้อง commit ทีละภาษา

      const isActive =
        category.is_active === true || category.is_active === 1 ? 1 : 0;
      const baseName = category.name ?? null; // เก็บ TH ไว้ใน base ตามดีไซน์เดิม
      const baseDesc = category.description ?? null;
      const imageUrl = category.image_url ?? null;

      // 1) สร้างเรคคอร์ดหลัก
      const [baseResult]: any = await conn.query(insertBaseSql, [
        baseName,
        baseDesc,
        imageUrl,
        isActive,
      ]);
      const newId: number = baseResult.insertId;

      // 2) แปลภาษาไทย (ถ้ามี)
      if (category.name || category.description) {
        await conn.query(insertTransSql, [
          newId,
          "th",
          category.name ?? "",
          category.description ?? "",
        ]);
      }

      // 3) แปลภาษาอังกฤษ (ถ้ามี)
      if (category.nameEn || category.descriptionEn) {
        await conn.query(insertTransSql, [
          newId,
          "en",
          category.nameEn ?? "",
          category.descriptionEn ?? "",
        ]);
      }

      await conn.commit();
      return newId;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to create product category:", error);
      throw new Error("Failed to create product category");
    } finally {
      conn.release();
    }
  }

  // Update product category
  // async updateCategory(
  //   category_id: number,
  //   category: Partial<Omit<ProductCategoryModel, "category_id">>
  // ): Promise<boolean> {
  //   const query = `
  //     UPDATE product_categories
  //     SET name=?, description=?, image_url=?, is_active=?
  //     WHERE category_id=?;
  //   `;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [
  //       category.name,
  //       category.description,
  //       category.image_url,
  //       category.is_active,
  //       category_id,
  //     ]);
  //     return (result as any).affectedRows > 0;
  //   } catch (error) {
  //     console.error("Failed to update product category:", error);
  //     throw new Error("Failed to update product category");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async updateCategory(
    category_id: number,
    category: {
      lang: string;
      name: string;
      description?: string;
      image_url?: string;
      is_active: boolean;
    }
  ): Promise<boolean> {
    const conn = await db.getConnection();

    try {

      // 1) อัปเดต base table (image_url และ is_active เท่านั้น)
      const baseFields: string[] = [];
      const baseParams: any[] = [];

      if (category.image_url !== undefined) {
        baseFields.push("image_url = ?");
        baseParams.push(category.image_url || null);
      }

      if (category.is_active !== undefined) {
        baseFields.push("is_active = ?");
        baseParams.push(category.is_active ? 1 : 0);
      }

      // อัปเดต base table ถ้ามีฟิลด์ที่เปลี่ยน
      if (baseFields.length > 0) {
        const sql = `UPDATE product_categories SET ${baseFields.join(
          ", "
        )} WHERE category_id = ?`;
        await conn.query(sql, [...baseParams, category_id]);
      }

      // 2) อัปเดต translation ตามภาษาที่ส่งมา
      const updateTransSql = `
			UPDATE product_categories_translations
			SET name = ?, description = ?
			WHERE product_category_id = ? AND lang = ?
		`;

      // อัปเดตเฉพาะภาษาที่ส่งมา (th หรือ en)
      await conn.query(updateTransSql, [
        category.name || "",
        category.description || "",
        category_id,
        category.lang,
      ]);

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to update product category:", error);
      throw new Error("Failed to update product category");
    } finally {
      conn.release();
    }
  }

  // Delete product category
  async deleteCategory(category_id: number): Promise<boolean> {
    const query = `DELETE FROM product_categories WHERE category_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [category_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete product category:", error);
      throw new Error("Failed to delete product category");
    } finally {
      conn.release();
    }
  }
}

export default new ProductCategoryService();
