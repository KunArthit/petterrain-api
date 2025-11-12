import {
  CartWishlistModel,
  CartWishlistType,
} from "../models/CartWishListModel";
import db from "@/core/database";

class CartWishlistService {
  /**
   * Creates a new item in the cart_wishlist table.
   * @param item - The data for the new item.
   * @returns The ID of the newly created item.
   */
  static async create(
    item: Omit<CartWishlistModel, "id" | "created_at" | "updated_at">
  ): Promise<number> {
    const query = `
      INSERT INTO cart_wishlist (user_id, product_id, quantity, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        item.user_id,
        item.product_id,
        item.quantity,
        item.type,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create cart/wishlist item:", error);
      throw new Error("Failed to create cart/wishlist item");
    } finally {
      conn.release();
    }
  }

  /**
   * Finds a single item by its primary key ID.
   * @param id - The ID of the item to find.
   * @returns The found item or null if not found.
   */
  static async findById(id: number): Promise<CartWishlistModel | null> {
    const query = `SELECT * FROM cart_wishlist WHERE id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [id]);
      const data = rows as CartWishlistModel[];
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error("Failed to find item by ID:", error);
      throw new Error("Failed to find item by ID");
    } finally {
      conn.release();
    }
  }

  /**
   * Finds all items for a specific user, optionally filtering by type.
   * @param userId - The ID of the user.
   * @param type - Optional type ('cart' or 'wishlist') to filter by.
   * @returns An array of found items.
   */
  
  static async findByUserId(
    userId: number,
    type?: CartWishlistType
  ): Promise<any[]> {
    // Query หลักที่ JOIN ตาราง products และกรอง is_active
    // *** แก้ไข: ลบเครื่องหมาย ; ที่ท้าย WHERE clause ออก ***
    let query = `
            SELECT
        cw.id,
        cw.user_id,
        cw.product_id,
        cw.quantity,
        (cw.quantity*p.sale_price) AS total_amount,
        cw.type,
        cw.created_at,
        cw.updated_at,
        pt.name,
        p.sku,
        pt.description,
        pt.short_description,
        p.stock_quantity,
        p.sale_price AS price,
        p.product_category_id,
        (
            SELECT pi.image_url
            FROM product_images AS pi
            WHERE pi.product_id = p.product_id
            ORDER BY pi.image_id ASC
            LIMIT 1
        ) AS image
      FROM cart_wishlist AS cw
      JOIN products AS p ON p.product_id = cw.product_id
			JOIN products_translations pt ON pt.product_id = p.product_id
      WHERE cw.user_id = ? AND p.is_active = 1
    `; // <== ไม่มี ; แล้ว
    const params: (number | string)[] = [userId];

    // เพิ่มเงื่อนไขสำหรับกรอง type (cart หรือ wishlist) ถ้ามีการส่งค่ามา
    if (type) {
      query += ` AND cw.type = ?`;
      params.push(type);
    }

    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, params);
      return rows as any[];
    } catch (error) {
      console.error("Failed to find items by user ID:", error);
      throw new Error("Failed to find items by user ID");
    } finally {
      conn.release();
    }
  }

  /**
   * Updates an existing item in the cart_wishlist table.
   * @param id - The ID of the item to update.
   * @param item - An object with the fields to update.
   * @returns True if the update was successful, false otherwise.
   */
  static async update(
    id: number,
    item: Partial<Omit<CartWishlistModel, "id" | "created_at" | "updated_at">>
  ): Promise<boolean> {
    const fields = Object.keys(item).filter(
      (key) => (item as any)[key] !== undefined
    );
    if (fields.length === 0) {
      return false; // Nothing to update
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => (item as any)[field]);
    values.push(id); // Add the id for the WHERE clause

    const query = `
      UPDATE cart_wishlist
      SET ${setClause}, updated_at = NOW()
      WHERE id = ?;
    `;

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, values);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update item:", error);
      throw new Error("Failed to update item");
    } finally {
      conn.release();
    }
  }

  /**
   * Deletes an item by its primary key ID.
   * @param id - The ID of the item to delete.
   * @returns True if the deletion was successful, false otherwise.
   */
  static async deleteById(id: number): Promise<boolean> {
    const query = `DELETE FROM cart_wishlist WHERE id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete item by ID:", error);
      throw new Error("Failed to delete item by ID");
    } finally {
      conn.release();
    }
  }

  /**
   * Deletes all items for a specific user, optionally filtering by type.
   * @param userId - The ID of the user.
   * @param type - Optional type ('cart' or 'wishlist') to clear.
   * @returns True if any rows were deleted, false otherwise.
   */
  static async deleteByUserId(
    userId: number,
    type?: CartWishlistType
  ): Promise<boolean> {
    let query = `DELETE FROM cart_wishlist WHERE user_id = ?`;
    const params: (number | string)[] = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, params);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete items by user ID:", error);
      throw new Error("Failed to delete items by user ID");
    } finally {
      conn.release();
    }
  }

  /**
   * Gets all items from the table.
   * @returns An array of all items.
   */
  static async getAllCartWishlist(): Promise<CartWishlistModel[]> {
    const query = `SELECT * FROM cart_wishlist`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as CartWishlistModel[];
    } catch (error) {
      console.error("Failed to fetch all items:", error);
      throw new Error("Failed to fetch all items");
    } finally {
      conn.release();
    }
  }
}

export default CartWishlistService;
