import type { UserModel } from "@/models/UserModel";
import db from "@/core/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ResultSetHeader } from "mysql2";

const SECRET_KEY =
  "66361c50ae255971f097887ccccf0fc59c604a2152f1326f36e134d05a49a5f86d7df7105d6e40884972b25ab4b8f13a79525766b6b97ecb569afb002a9279934041406c2e11f391bf67a1249934a617b51db3ae90ddfe99095a84150f454b2c00afaac6f3bb08d3b56bf124ce93c004697d2eee4c7157a2e1b1fda3349954b18c6d6051839bf0da88f1caab492ee27bd42d095b4b5f673377bde3f9fb54ce0913b1d366293d70205560e2f1d7fc9d370de64dcc24f9fdd2f14046b4c5f678c841a4345f9ff562363b1e4ef8e061c79f25dfccc750f507155504efb229f2d8a49cefd9a31078375c2e2820d30db625ef2465e1ff7987d026ad5567a6bb9a162c";
const TOKEN_EXPIRY = "1d";

class UserService {
  constructor() {
    console.log("User service created");
  }

  async getUserByUsername(username: string): Promise<UserModel | null> {
    const query = `SELECT * FROM users WHERE username = ?`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [username]);
      return (rows as UserModel[])[0] || null;
    } finally {
      conn.release();
    }
  }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    const query = `SELECT * FROM users WHERE email = ?`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [email]);
      return (rows as UserModel[])[0] || null;
    } finally {
      conn.release();
    }
  }

  async login(username: string, password: string): Promise<string> {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("User not found");

    // Compare passwords directly (plain text comparison)
    if (user.password !== password) throw new Error("Invalid password");

    const payload = {
      user_id: user.user_id,
      username: user.username,
      user_type_id: user.user_type_id,
      department_id: user.department_id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });

    return token;
  }

  // Get all users
  async getAllUsers(): Promise<UserModel[]> {
    const query = `SELECT 
    u.*, 
    ut.type_name, 
    d.department_name, 
    d.description  
FROM users AS u
JOIN user_types AS ut ON u.user_type_id = ut.type_id
JOIN departments AS d ON u.department_id = d.department_id;
`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as UserModel[];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw new Error("Failed to fetch users");
    } finally {
      conn.release();
    }
  }

  // Get user by ID
  async getUserById(user_id: number): Promise<UserModel | null> {
    const query = `SELECT * FROM users WHERE user_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [user_id]);
      return Array.isArray(rows) && rows.length ? (rows[0] as UserModel) : null;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      throw new Error("Failed to fetch user");
    } finally {
      conn.release();
    }
  }

  async getCartListByUserId({
    id,
    type,
  }: {
    id: number;
    type: string;
  }): Promise<any[]> {
    const query = `SELECT cl.*,
      p.category_id,
      p.sku,
      p.description,
      p.short_description,
      p.price,
      p.sale_price,
      p.stock_quantity,
      p.is_featured,
      p.is_active,
      p.product_category_id
    FROM cart_wish_list AS cl
    JOIN users AS u ON u.user_id = cl.user_id
    JOIN products AS p ON p.product_id = cl.product_id
    WHERE cl.user_id = ?
      AND cl.type = ?`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [id, type]);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error("Failed to fetch cart list:", error);
      throw new Error("Failed to fetch cart list");
    } finally {
      conn.release();
    }
  }

  // Service
  async createCartWishList(data: {
    user_id: number;
    product_id: number;
    type: string;
    quantity: number;
  }): Promise<number> {
    const query = `
    INSERT INTO cart_wish_list 
      (user_id, product_id, type, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;
    const conn = await db.getConnection();
    try {
      const [result]: any = await conn.query(query, [
        data.user_id,
        data.product_id,
        data.type,
        data.quantity,
      ]);
      return result.insertId; // ส่งคืน id ที่เพิ่มใหม่
    } catch (error) {
      console.error("Failed to create cart wish list:", error);
      throw new Error("Failed to create cart wish list");
    } finally {
      conn.release();
    }
  }

  async updateCartWishList(data: {
    id: number; // PK ของ cart_wish_list
    quantity?: number; // จำนวนใหม่ (optional)
  }): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.quantity !== undefined) {
      fields.push("quantity = ?");
      values.push(data.quantity);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(data.id);

    const query = `
    UPDATE cart_wish_list
    SET ${fields.join(", ")}
    WHERE id = ?
     `;

    const conn = await db.getConnection();
    try {
      const [result]: any = await conn.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Failed to update cart wish list:", error);
      throw new Error("Failed to update cart wish list");
    } finally {
      conn.release();
    }
  }

  async deleteCartWishList(id: number): Promise<boolean> {
    const query = `DELETE FROM cart_wish_list WHERE id = ?`;
    const conn = await db.getConnection();
    try {
      const [result]: any = await conn.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete cart wish list:", error);
      throw new Error("Failed to delete cart wish list");
    } finally {
      conn.release();
    }
  }

  // Create user
  async createUser(
    user: Omit<UserModel, "user_id" | "created_at" | "updated_at">
  ): Promise<number> {
    // ตรวจสอบทั้ง username และ email
    const checkQuery = `
    SELECT 
      COUNT(CASE WHEN username = ? THEN 1 END) as username_count,
      COUNT(CASE WHEN email = ? THEN 1 END) as email_count
    FROM users 
    WHERE username = ? OR email = ?
  `;

    const insertQuery = `
    INSERT INTO users (username, email, password, first_name, last_name, phone, user_type_id, department_id, company_name, tax_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

    const conn = await db.getConnection();

    try {
      // ตรวจสอบว่า username หรือ email มีอยู่แล้วหรือไม่
      const [checkResult] = await conn.query(checkQuery, [
        user.username,
        user.email,
        user.username,
        user.email,
      ]);

      const { username_count, email_count } = (checkResult as any)[0];

      // ตรวจสอบการซ้ำและส่ง error ที่ชัดเจน
      if (username_count > 0 && email_count > 0) {
        throw new Error("Both username and email already exist.");
      } else if (username_count > 0) {
        throw new Error(`Username "${user.username}" already exists.`);
      } else if (email_count > 0) {
        throw new Error(`Email "${user.email}" already exists.`);
      }

      // เข้ารหัส password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insert user ใหม่
      const [result] = await conn.query(insertQuery, [
        user.username,
        user.email,
        hashedPassword,
        user.first_name,
        user.last_name,
        user.phone,
        user.user_type_id,
        user.department_id,
        user.company_name,
        user.tax_id,
        user.is_active,
      ]);

      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw new Error((error as Error).message || "Failed to create user");
    } finally {
      conn.release();
    }
  }

  // Update user
  // async updateUser(
  //   user_id: number,
  //   user: Partial<Omit<UserModel, "user_id" | "created_at">>
  // ): Promise<boolean> {
  //   const query = `
  //     UPDATE users
  //     SET username=?, email=?, password=?, first_name=?, last_name=?, phone=?, user_type_id=?, department_id=?, company_name=?, tax_id=?, is_active=?, updated_at=NOW()
  //     WHERE user_id=?;
  //   `;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [
  //       user.username,
  //       user.email,
  //       user.password,
  //       user.first_name,
  //       user.last_name,
  //       user.phone,
  //       user.user_type_id,
  //       user.department_id,
  //       user.company_name,
  //       user.tax_id,
  //       user.is_active,
  //       user_id,
  //     ]);
  //     return (result as any).affectedRows > 0;
  //   } catch (error) {
  //     console.error("Failed to update user:", error);
  //     throw new Error("Failed to update user");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async updateUser(
    user_id: number,
    user: Partial<Omit<UserModel, "user_id" | "created_at">>
  ): Promise<Partial<UserModel>> {
    const conn = await db.getConnection();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(user).forEach(([key, value]) => {
        if (typeof value !== "undefined") {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      updates.push("updated_at = NOW()");
      const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE user_id = ?
    `;
      values.push(user_id);

      const [result] = await conn.query(query, values);

      if ((result as any).affectedRows === 0) {
        throw new Error("User not found or no rows updated");
      }

      const updatedUser = await this.getUserById(user_id);

      return updatedUser as UserModel;
    } catch (error) {
      console.error("Failed to update user:", error);
      throw new Error("Failed to update user");
    } finally {
      conn.release();
    }
  }

  // Delete user
  // async deleteUser(user_id: number): Promise<boolean> {
  //   const query = `DELETE FROM users WHERE user_id = ?;`;
  //   const conn = await db.getConnection();
  //   try {
  //     const [result] = await conn.query(query, [user_id]);
  //     return (result as any).affectedRows > 0;
  //   } catch (error) {
  //     console.error("Failed to delete user:", error);
  //     throw new Error("Failed to delete user");
  //   } finally {
  //     conn.release();
  //   }
  // }

  async deleteUser(user_id: number): Promise<boolean> {
    const conn = await db.getConnection();

    try {
      // 1. ปิดการตรวจสอบ Foreign Key ชั่วคราว
      // นี่เป็นสิ่งสำคัญเพื่อให้สามารถลบ user ได้โดยไม่ติดข้อจำกัด Foreign Key
      // ตารางอื่น ๆ ที่เคยอ้างอิงถึง user_id นี้จะยังคงข้อมูลของตัวเองไว้
      // แต่จะอ้างอิงถึง user_id ที่ไม่มีอยู่แล้ว (orphan records)
      await conn.query("SET FOREIGN_KEY_CHECKS = 0;");

      // 2. ลบผู้ใช้ในตาราง `users`
      // ตรวจสอบอีกครั้งว่าคอลัมน์ Primary Key ของตาราง users คือ 'user_id' หรือ 'id'
      // จากโค้ดที่คุณให้มาล่าสุด คุณใช้ 'user_id' ดังนั้นผมจะคงไว้ตามนั้น
      const deleteUserQuery = `DELETE FROM users WHERE user_id = ?;`;
      const [result] = await conn.query<ResultSetHeader>(deleteUserQuery, [
        user_id,
      ]);

      // 3. เปิดการตรวจสอบ Foreign Key กลับมา
      await conn.query("SET FOREIGN_KEY_CHECKS = 1;");

      // คืนค่า true ถ้ามีการลบแถวข้อมูล (แสดงว่าเจอ user และลบสำเร็จ)
      return result.affectedRows > 0;
    } catch (error) {
      // 4. หากเกิดข้อผิดพลาด ให้แน่ใจว่าได้เปิดการตรวจสอบ Foreign Key กลับมาเสมอ
      // (สำคัญมากเพื่อป้องกันปัญหา Foreign Key Constraint ในการทำงานอื่น ๆ)
      await conn.query("SET FOREIGN_KEY_CHECKS = 1;");
      console.error(`Failed to delete user with ID ${user_id}:`, error);
      throw new Error(`Failed to delete user ${user_id}.`);
    } finally {
      // 5. คืน connection กลับสู่ pool ไม่ว่าจะสำเร็จหรือล้มเหลว
      conn.release();
    }
  }

  /**
   * Update a user's password by email
   * @param email - User's email
   * @param hashedPassword - New hashed password
   * @returns Promise<boolean> - True if update succeeded
   */
  async updateUserPassword(
    email: string,
    hashedPassword: string
  ): Promise<boolean> {
    const updateQuery = `
    UPDATE users
    SET password = ?, updated_at = NOW()
    WHERE email = ?;
    `;

    const conn = await db.getConnection();

    try {
      const [result] = await conn.query(updateQuery, [hashedPassword, email]);

      if ((result as any).affectedRows === 0) {
        console.warn(`No user found with email: ${email}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to update password:", error);
      throw new Error((error as Error).message || "Failed to update password");
    } finally {
      conn.release();
    }
  }

  async userPasswordChange(
    id: number,
    hashedPassword: string
  ): Promise<boolean> {
    const updateQuery = `
    UPDATE users
    SET password = ?, updated_at = NOW()
    WHERE user_id = ?;
  `;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(updateQuery, [hashedPassword, id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update password:", error);
      throw new Error("Failed to update password");
    } finally {
      conn.release();
    }
  }
}

export default new UserService();
