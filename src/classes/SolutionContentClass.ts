import { SolutionContentModel } from "../models/SolutionContentModel";
import db from "@/core/database";

class SolutionContentService {
  // Get all solution content
  async getAllContent(): Promise<any[]> {
    const query = `
            SELECT 
                sc.content_id,
                sc.solution_id,
                sct.lang,
                sct.title,
                sct.content,
                sc.content_order,
                sct.created_at,
                sct.updated_at
            FROM solution_content sc
            LEFT JOIN solution_content_translations sct ON sct.solution_content_id = sc.content_id
            ORDER BY sc.content_id ASC, sct.lang ASC;
    `;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as SolutionContentModel[];
    } catch (error) {
      console.error("Failed to fetch solution content:", error);
      throw new Error("Failed to fetch solution content");
    } finally {
      conn.release();
    }
  }

  // Get solution content by ID
  async getContentById(
    content_id: number
  ): Promise<SolutionContentModel[] | null> {
    // ปรับ return type ให้ตรงกับผลลัพธ์
    const query = `
      SELECT 
          sc.content_id,
          sc.solution_id,
          sct.lang,
          sct.title,
          sct.content,
          sc.content_order,
          sct.created_at,
          sct.updated_at
      FROM solution_content sc
      LEFT JOIN solution_content_translations sct ON sct.solution_content_id = sc.content_id
      WHERE sc.content_id = ?
  `;
    const conn = await db.getConnection();
    try {
      // mysql2/promise คืนค่าเป็น [rows, fields]
      const [rows]: [any[], any] = await conn.query(query, [content_id]);

      // คืนค่าเป็น Array ของทุกภาษาที่เจอ หรือ null ถ้าไม่เจอ content_id นั้นเลย
      return rows.length > 0 ? rows : null;
    } catch (error) {
      console.error("Failed to fetch solution content:", error);
      throw new Error("Failed to fetch solution content");
    } finally {
      conn.release();
    }
  }

  // Get content by Solution ID
  async getContentBySolutionId(
    solution_id: number
  ): Promise<SolutionContentModel[]> {
    const query = `
      SELECT 
          sc.content_id,
          sc.solution_id,
          sct.lang,
          sct.title,
          sct.content,
          sc.content_order,
          sct.created_at,
          sct.updated_at
      FROM solution_content sc
      LEFT JOIN solution_content_translations sct ON sct.solution_content_id = sc.content_id
      WHERE sc.solution_id = ?
			ORDER BY content_order ASC;
    `;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [solution_id]);
      return rows as SolutionContentModel[];
    } catch (error) {
      console.error("Failed to fetch content by solution ID:", error);
      throw new Error("Failed to fetch content by solution ID");
    } finally {
      conn.release();
    }
  }

  // Create a new solution content
  // async createContent(
  //   content: Omit<
  //     SolutionContentModel,
  //     "content_id" | "created_at" | "updated_at"
  //   >
  // ): Promise<number> {
  //   const query = `
  //     INSERT INTO solution_content (solution_id, title, content, content_order, created_at, updated_at)
  //     VALUES (?, ?, ?, ?, NOW(), NOW());
  //   `;
  //   const conn = await db.getConnection();

  //   try {
  //     const [result] = await conn.query(query, [
  //       content.solution_id,
  //       content.title,
  //       content.content,
  //       content.content_order,
  //     ]);
  //     return (result as any).insertId;
  //   } catch (error) {
  //     console.error("Failed to create solution content:", error);
  //     throw new Error("Failed to create solution content");
  //   } finally {
  //     conn.release();
  //   }
  // }

  // async createContent(
  //   content: Omit<any, "content_id" | "created_at" | "updated_at">
  // ): Promise<number> {
  //   const query = `
  //     INSERT INTO solution_content (solution_id, title, content, content_order, created_at, updated_at)
  //     VALUES (?, ?, ?, ?, NOW(), NOW());
  //   `;

  //   const queryLeng = `
  //     INSERT INTO solution_content_translations (solution_content_id, title, content, content_order, created_at, updated_at)
  //     VALUES (?, ?, ?, ?, NOW(), NOW());
  //   `;

  //   const conn = await db.getConnection();

  //   try {
  //     const [result] = await conn.query(query, [
  //       content.solution_id,
  //       content.title,
  //       content.content,
  //       content.content_order,
  //     ]);

  //     const getSolutionContentId = (result as any).insertId;

  //     const [resultTH] = await conn.query(queryLeng, [
  //       (content.solution_content_id = getSolutionContentId),
  //       (content.leng = "th"),
  //       content.title,
  //       content.content,
  //       content.content_order,
  //     ]);

  //     const [resultEN] = await conn.query(queryLeng, [
  //       (content.solution_content_id = getSolutionContentId),
  //       (content.leng = "en"),
  //       content.title,
  //       content.content,
  //       content.content_order,
  //     ]);
  //     return (result as any).insertId;
  //   } catch (error) {
  //     console.error("Failed to create solution content:", error);
  //     throw new Error("Failed to create solution content");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async createContent(
    content: Omit<any, "content_id" | "created_at" | "updated_at">
  ): Promise<number> {
    // ใช้ไทยเป็นค่า fallback ของตารางหลัก ถ้าไทยว่างจะใช้อังกฤษแทน
    const mainTitle = content.title_th || content.title || "";
    const mainContent = content.content_th || content.content || "";

    const insertMain = `
    INSERT INTO solution_content (solution_id, title, content, content_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW());
  `;

    // NOTE: translations ต้องมีคอลัมน์ lang และไม่มี content_order
    const insertTrans = `
    INSERT INTO solution_content_translations (solution_content_id, lang, title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      content = VALUES(content),
      updated_at = NOW();
  `;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1) แถวหลัก
      const [result] = await conn.query(insertMain, [
        content.solution_id,
        mainTitle,
        mainContent,
        content.content_order ?? 0,
      ]);
      const solutionContentId = (result as any).insertId as number;

      // 2) แปลภาษา TH
      await conn.query(insertTrans, [
        solutionContentId,
        "th",
        content.title_th ?? "",
        content.content_th ?? "",
      ]);

      // 3) แปลภาษา EN
      await conn.query(insertTrans, [
        solutionContentId,
        "en",
        content.title ?? "",
        content.content ?? "",
      ]);

      await conn.commit();
      return solutionContentId;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to create solution content:", error);
      throw new Error("Failed to create solution content");
    } finally {
      conn.release();
    }
  }

  // async createContent(content: {
  //   solution_id: number;
  //   content_order?: number; // ✅ optional
  //   title: string; // th
  //   content: string; // th
  //   title_en?: string; // optional
  //   content_en?: string; // optional
  // }): Promise<number> {
  //   const conn = await db.getConnection();

  //   try {
  //     await conn.beginTransaction();

  //     // 1) insert main content
  //     const mainQuery = `
  //     INSERT INTO solution_content (solution_id, content_order, created_at, updated_at)
  //     VALUES (?, ?, NOW(), NOW());
  //   `;
  //     const [mainResult] = await conn.query(mainQuery, [
  //       content.solution_id,
  //       content.content_order ?? 0, // ✅ default เป็น 0 ถ้า undefined
  //     ]);

  //     const contentId = (mainResult as any).insertId;
  //     if (!contentId) throw new Error("Failed to insert into solution_content");

  //     // 2) insert translation TH
  //     const translationQuery = `
  //     INSERT INTO solution_content_translations (solution_content_id, lang, title, content, created_at, updated_at)
  //     VALUES (?, ?, ?, ?, NOW(), NOW());
  //   `;
  //     await conn.query(translationQuery, [
  //       contentId,
  //       "th",
  //       content.title,
  //       content.content,
  //     ]);

  //     // 3) insert translation EN
  //     if (content.title_en && content.content_en) {
  //       // กรณีมีภาษาอังกฤษส่งมาจาก frontend
  //       await conn.query(translationQuery, [
  //         contentId,
  //         "en",
  //         content.title_en,
  //         content.content_en,
  //       ]);
  //     } else {
  //       // MOCKUP: แปลอัตโนมัติ
  //       console.log(
  //         "No English translation provided, mocking Google Translate API..."
  //       );

  //       // TODO: call Google Translate API จริงในอนาคต
  //       // const [translatedTitle] = await translate.translate(content.title, "en");
  //       // const [translatedContent] = await translate.translate(content.content, "en");

  //       const translatedTitle = `[EN] ${content.title}`;
  //       const translatedContent = `[EN] ${content.content}`;

  //       await conn.query(translationQuery, [
  //         contentId,
  //         "en",
  //         translatedTitle,
  //         translatedContent,
  //       ]);

  //       console.log("Mock translation saved for EN");
  //     }

  //     await conn.commit();
  //     return contentId;
  //   } catch (error) {
  //     await conn.rollback();
  //     console.error("Failed to create solution content:", error);
  //     throw new Error("Failed to create solution content");
  //   } finally {
  //     conn.release();
  //   }
  // }

  // Update solution content
  async updateContent(
  content_id: number,
  // 2. ใช้ Type ที่ชัดเจน (ถ้าคุณส่งข้อมูลครบทุก field ตาม Interface นี้)
  //    ถ้ายังต้องการส่งแค่บางส่วนจริงๆ ต้องไปแก้ Query ให้เป็น Dynamic ครับ
  content: Omit<any, "content_id" | "created_at" | "updated_at" >
): Promise<boolean> {

  console.log(content);
  
  const query = `
    UPDATE solution_content
    SET solution_id=?, title=?, content=?, content_order=?, updated_at=NOW()
    WHERE content_id=?;
  `;

  const queryTransection = `
    UPDATE solution_content_translations
    SET title=?, content=?, updated_at=NOW()
    WHERE solution_content_id=? and lang = ?;
  `;
  
  // 3. Get connection
  const conn = await db.getConnection();
  
  try {
    // 4. เริ่ม Transaction
    await conn.beginTransaction();

    // 5. Query 1 (Main content)
    const [result1] = await conn.query(query, [
      content.solution_id,
      content.title,
      content.content,
      content.content_order,
      content_id,
    ]);

    // 6. Query 2 (TH translation) - แก้ไข Parameter แล้ว
    const [result2] = await conn.query(queryTransection, [
      content.title_th,    // Correct
      content.content_th,  // Correct
      content_id,
      'th'
    ]);

    // 7. Query 3 (EN translation) - แก้ไข Parameter แล้ว
    const [result3] = await conn.query(queryTransection, [
      content.title,       // Correct
      content.content,     // Correct
      content_id,
      'en'
    ]);

    // 8. ถ้าทุกอย่างสำเร็จ ให้ Commit
    await conn.commit();

    // 9. ตรวจสอบว่ามีแถวไหนถูกอัปเดตบ้างหรือไม่
    const totalAffected = (result1 as any).affectedRows + 
                          (result2 as any).affectedRows + 
                          (result3 as any).affectedRows;
                          
    return totalAffected > 0;

  } catch (error) {
    // 10. ถ้ามี Error เกิดขึ้น ให้ Rollback
    await conn.rollback();
    console.error("Failed to update solution content, transaction rolled back:", error);
    throw new Error("Failed to update solution content"); // โยน Error ต่อ
  } finally {
    // 11. คืน Connection ไม่ว่าจะสำเร็จหรือล้มเหลว
    conn.release();
  }
}

  // Reorder multiple content items
  async reorderContents(
    contents: { content_id: number; content_order: number }[]
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const item of contents) {
        await conn.query(
          `UPDATE solution_content SET content_order = ?, updated_at = NOW() WHERE content_id = ?;`,
          [item.content_order, item.content_id]
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      console.error("Failed to reorder solution content:", error);
      await conn.rollback();
      return false;
    } finally {
      conn.release();
    }
  }

  // Delete solution content
  async deleteContent(content_id: number): Promise<boolean> {
    const query = `DELETE FROM solution_content WHERE content_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [content_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete solution content:", error);
      throw new Error("Failed to delete solution content");
    } finally {
      conn.release();
    }
  }
}

export default new SolutionContentService();
