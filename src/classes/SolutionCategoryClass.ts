import { SolutionCategoryModel } from "../models/SolutionCategoryModel";
import db from "@/core/database";
import { FieldPacket } from "mysql2";

type SolutionMediaModel = {
  media_id: number;
  solution_id: number;
  media_type: string;
  media_url: string;
  caption: string;
  display_order: number;
  created_at: string; // or `Date` if you convert it
  updated_at: string; // or `Date` if you convert it
};

class SolutionCategoryService {
  // Get all solution categories
  async getAllCategories(): Promise<any[]> {
    const query = `SELECT
                    sc.category_id,
                    sct.id AS translation_id,
                    sct.lang,
                    sct.name,
                    sct.description,
                    sc.image_url,
                    sc.active
                  FROM solution_categories sc 
                  LEFT JOIN
                    solution_categories_translations sct ON sct.solution_category_id = sc.category_id`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as any[];
    } catch (error) {
      console.error("Failed to fetch solution categories:", error);
      throw new Error("Failed to fetch solution categories");
    } finally {
      conn.release();
    }
  }

  // Get solution category by ID
  async getCategoryById(
    category_id: number
  ): Promise<SolutionCategoryModel[] | null> {
    const conn = await db.getConnection();

    try {
      const [categoryRows] = await conn.query(
        `
          SELECT
            sc.category_id,
            sct.id AS translation_id,
            sct.lang,
            sct.name,
            sct.description,
            sc.image_url,
            sc.active
          FROM solution_categories sc 
          LEFT JOIN
            solution_categories_translations sct ON sct.solution_category_id = sc.category_id
          WHERE sc.category_id = ?
        `,
        [category_id]
      );

      if (
        !categoryRows ||
        (Array.isArray(categoryRows) && categoryRows.length === 0)
      ) {
        return null;
      }

      return categoryRows as SolutionCategoryModel[];
    } catch (error) {
      console.error("Failed to fetch solution category:", error);
      throw new Error("Failed to fetch solution category");
    } finally {
      conn.release();
    }
  }

  // Create a new solution category
  // async createCategory(category: Omit<any, "category_id">): Promise<number> {
  //   console.log("Creating category:", category);

  //   const query = `
  //     INSERT INTO solution_categories (name, description, image_url, active)
  //     VALUES (?, ?, ?, ?);
  //   `;
  //   const conn = await db.getConnection();

  //   // สำหรับการแทรก API ภาษาไทยและอังกฤษ

  //   const queryTH = `
  //     INSERT INTO solution_categories_translations (solution_categories_id, lang, name, description)
  //     VALUES (?, ?, ?, ?);
  //   `;
  //   const connTH = await db.getConnection();

  //   const queryEN = `
  //     INSERT INTO solution_categories_translations (solution_categories_id, lang, name, description)
  //     VALUES (?, ?, ?, ?);
  //   `;
  //   const connEN = await db.getConnection();

  //   try {
  //     const [result] = await conn.query(query, [
  //       category.name,
  //       category.description,
  //       category.image_url,
  //       category.active,
  //     ]);
  //     return (result as any).insertId;
  //   } catch (error) {
  //     console.error("Failed to create solution category:", error);
  //     throw new Error("Failed to create solution category");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async createCategory(category: any): Promise<number> {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const mainQuery = `
      INSERT INTO solution_categories (name, description, image_url, active)
      VALUES (?, ?, ?, ?);
    `;
      const [mainResult] = await conn.query(mainQuery, [
        category.name,
        category.description,
        category.image_url,
        category.active,
      ]);

      const categoryId = (mainResult as any).insertId;
      if (!categoryId) {
        throw new Error(
          "Failed to insert into main category table, no insertId returned."
        );
      }

      const translationQuery = `
      INSERT INTO solution_categories_translations (solution_category_id, lang, name, description)
      VALUES (?, ?, ?, ?);
    `;

      // บันทึกข้อมูลภาษาต้นฉบับ (สมมติว่าเป็นภาษาไทย)
      await conn.query(translationQuery, [
        categoryId,
        "th",
        category.name,
        category.description,
      ]);

      // ตรวจสอบและบันทึกข้อมูลภาษาอังกฤษ
      if (category.name_en && category.description_en) {
        // --- กรณีที่ 1: มีการส่งข้อมูลภาษาอังกฤษมาโดยตรงจาก Frontend ---
        console.log("Saving provided English translation.");
        await conn.query(translationQuery, [
          categoryId,
          "en",
          category.name_en,
          category.description_en,
        ]);
      } else {
        // --- กรณีที่ 2: ไม่ได้ส่งข้อมูลภาษาอังกฤษมา (ส่วนสำหรับเรียก API ในอนาคต) ---

        // ================= MOCKUP: เริ่มส่วนแปลภาษาอัตโนมัติ =================
        // ในอนาคต ให้ลบ comment (uncomment) ในบล็อกนี้เพื่อเปิดใช้งาน

        // console.log("No English translation provided, calling Google Translate API...");
        // const targetLang = 'en';

        // // เรียก API เพื่อแปลชื่อและรายละเอียด
        // const [translatedName] = await translate.translate(category.name, targetLang);
        // const [translatedDesc] = await translate.translate(category.description, targetLang);

        // // บันทึกผลลัพธ์ที่ได้จากการแปลลงฐานข้อมูล
        // await conn.query(translationQuery, [
        //   categoryId,
        //   targetLang,
        //   translatedName,
        //   translatedDesc,
        // ]);

        // console.log(`Successfully translated and saved for lang: ${targetLang}`);

        // ================= MOCKUP: จบส่วนแปลภาษาอัตโนมัติ ===================

        // ในตอนนี้ เมื่อไม่มีข้อมูลส่งมา ก็จะยังไม่มีการทำอะไร
        console.log("No English translation provided, skipping.");
      }

      await conn.commit();
      console.log(`Successfully created category with ID: ${categoryId}`);
      return categoryId;
    } catch (error) {
      await conn.rollback();
      console.error(
        "Failed to create solution category, transaction rolled back:",
        error
      );
      throw new Error("Failed to create solution category");
    } finally {
      conn.release();
    }
  }

  // Update solution category
  // async updateCategory(
  //   category_id: number,
  //   category: Partial<Omit<SolutionCategoryModel, "category_id">>
  // ): Promise<boolean> {
  //   const query = `
  //     UPDATE solution_categories
  //     SET name=?, description=?, image_url=?, active=?
  //     WHERE category_id=?;
  //   `;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [
  //       category.name,
  //       category.description,
  //       category.image_url,
  //       category.active,
  //       category_id,
  //     ]);
  //     return (result as any).affectedRows > 0;
  //   } catch (error) {
  //     console.error("Failed to update solution category:", error);
  //     throw new Error("Failed to update solution category");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async updateCategory(
    category_id: number,
    translation_id: number,
    category: any
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // อัปเดตตารางหลัก (global fields)
      if (category.image_url !== undefined || category.active !== undefined) {
        const mainQuery = `
        UPDATE solution_categories
        SET image_url = COALESCE(?, image_url),
            active = COALESCE(?, active)
        WHERE category_id=?;
      `;
        await conn.query(mainQuery, [
          category.image_url,
          category.active,
          category_id,
        ]);
      }

      // อัปเดตตาราง translations (localization fields)
      if (category.name !== undefined || category.description !== undefined) {
        const translationQuery = `
        UPDATE solution_categories_translations
        SET name = COALESCE(?, name),
            description = COALESCE(?, description)
        WHERE solution_category_id=? AND id=?;
      `;
        await conn.query(translationQuery, [
          category.name,
          category.description,
          category_id,
          translation_id,
        ]);
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to update solution category:", error);
      throw new Error("Failed to update solution category");
    } finally {
      conn.release();
    }
  }

  // Delete solution category
  // async deleteCategory(category_id: number): Promise<boolean> {
  //   const query = `DELETE FROM solution_categories WHERE category_id = ?;`;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [category_id]);
  //     return (result as any).affectedRows > 0;
  //   } catch (error) {
  //     console.error("Failed to delete solution category:", error);
  //     throw new Error("Failed to delete solution category");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async deleteCategory(category_id: number): Promise<boolean> {
    // 1. Query สำหรับอัปเดตตาราง products ให้ category_id เป็น NULL
    const updateProductsQuery = `
    UPDATE products 
    SET category_id = NULL 
    WHERE category_id = ?;
  `;

    // 2. Query สำหรับลบ solution_category
    const deleteCategoryQuery = `
    DELETE FROM solution_categories 
    WHERE category_id = ?;
  `;

    const conn = await db.getConnection();

    try {
      // ---- เริ่ม Transaction ----
      await conn.beginTransaction();

      // ขั้นตอนที่ 1: อัปเดตตาราง products ก่อน
      await conn.query(updateProductsQuery, [category_id]);

      // ขั้นตอนที่ 2: จากนั้นจึงลบ category หลัก
      // การลบนี้จะไป trigger ON DELETE CASCADE กับตารางลูกอื่นๆ (ที่ไม่ใช่ products) โดยอัตโนมัติ
      const [result] = await conn.query(deleteCategoryQuery, [category_id]);

      // ---- ยืนยันการเปลี่ยนแปลงทั้งหมดถ้าสำเร็จ ----
      await conn.commit();

      // คืนค่าว่าการลบสำเร็จหรือไม่
      return (result as any).affectedRows > 0;
    } catch (error) {
      // ---- หากมีข้อผิดพลาด ให้ยกเลิกการเปลี่ยนแปลงทั้งหมดที่ทำมา ----
      await conn.rollback();

      console.error(
        "Failed to delete solution category with transaction:",
        error
      );
      throw new Error("Failed to delete solution category");
    } finally {
      // ---- คืน connection กลับสู่ pool ไม่ว่าจะสำเร็จหรือล้มเหลว ----
      conn.release();
    }
  }
}

export default new SolutionCategoryService();
