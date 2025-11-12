import { UserTypeModel } from "../models/UserTypeModel";
import db from "@/core/database";
import { FieldPacket } from "mysql2";

class UserTypeService {
  async deleteUserType(id: number): Promise<boolean> {
    const query = `DELETE FROM user_types WHERE type_id = ?`;
    const conn = await db.getConnection();

    try {
      const [result] = await conn.query(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete user type:", error);
      throw new Error("Cannot delete: User type is referenced by other records");
    } finally {
      conn.release();
    }
  }

  // Get all user types
  async getAllUserTypes(): Promise<UserTypeModel[]> {
    const query = `SELECT * FROM user_types;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as UserTypeModel[];
    } catch (error) {
      console.error("Failed to fetch user types:", error);
      throw new Error("Failed to fetch user types");
    } finally {
      conn.release();
    }
  }

   async getCountUserRole(): Promise<UserTypeModel[]> {
    const query = `SELECT
                      ut.type_id AS user_type_id,
                      COUNT(u.user_type_id) AS user_count
                  FROM
                      user_types ut
                  LEFT JOIN
                      users u ON ut.type_id = u.user_type_id
                  GROUP BY
                      ut.type_id
                  ORDER BY
                      ut.type_id;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as UserTypeModel[];
    } catch (error) {
      console.error("Failed to fetch user types:", error);
      throw new Error("Failed to fetch user types");
    } finally {
      conn.release();
    }
  }

  // Get user type by ID
  async getUserTypeById(type_id: number): Promise<UserTypeModel | null> {
    const query = `SELECT * FROM user_types WHERE type_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], FieldPacket[]] = await conn.query(query, [type_id]);
      return rows.length ? (rows[0] as UserTypeModel) : null;
    } catch (error) {
      console.error("Failed to fetch user type:", error);
      throw new Error("Failed to fetch user type");
    } finally {
      conn.release();
    }
  }

  // Create a new user type
  async createUserType(
    userType: Omit<UserTypeModel, "type_id">
  ): Promise<number> {
    const query = `INSERT INTO user_types (type_name) VALUES (?);`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [userType.type_name]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create user type:", error);
      throw new Error("Failed to create user type");
    } finally {
      conn.release();
    }
  }

  // Update user type
  async updateUserType(
    type_id: number,
    userType: Partial<Omit<UserTypeModel, "type_id">>
  ): Promise<boolean> {
    const query = `UPDATE user_types SET type_name = ? WHERE type_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [userType.type_name, type_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete user type:", error);
      throw new Error("Failed to delete user type");
    } finally {
      conn.release();
    }
  }
}

export default new UserTypeService();
