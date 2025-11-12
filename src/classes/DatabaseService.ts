// services/DatabaseService.ts
import db from "@/core/database";
import { ResultSetHeader } from "mysql2";

class DatabaseService {
  /**
   * Execute multiple operations in a database transaction
   */
  static async executeInTransaction<T>(
    operations: () => Promise<T>
  ): Promise<T> {
    try {
      // Start transaction
      await db.beginTransaction();

      // Execute operations
      const result = await operations();

      // Commit transaction
      await db.commit();

      return result;
    } catch (error) {
      // Rollback transaction on error
      await db.rollback();
      console.error("❌ Database transaction failed, rolled back:", error);
      throw error;
    }
  }

  /**
   * Safe database operation with automatic retry
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️ Database operation failed (attempt ${attempt}/${retries}):`,
          error.message
        );

        if (attempt < retries) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    console.error(`❌ Database operation failed after ${retries} attempts`);
    throw lastError!;
  }

  /**
   * Check database connection
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await db.execute("SELECT 1");
      return true;
    } catch (error) {
      console.error("❌ Database connection check failed:", error);
      return false;
    }
  }

  /**
   * Execute a query with parameters safely
   */
  static async query(sql: string, params: any[] = []) {
    try {
      const [rows] = await db.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("❌ Database query failed:", { sql, params, error });
      throw error;
    }
  }

  /**
   * Insert with automatic retry and return inserted ID
   */
  static async insert(table: string, data: Record<string, any>) {
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    return this.safeExecute(async () => {
      const [result] = await db.execute(sql, values);
      const [header] = result as ResultSetHeader[];
      return header.insertId;
    });
  }

  /**
   * Update with automatic retry
   */
  static async update(
    table: string,
    data: Record<string, any>,
    whereClause: string,
    whereParams: any[]
  ) {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

    return this.safeExecute(async () => {
      const [queryResult] = await db.execute(sql, values);
      const resultHeader = queryResult as ResultSetHeader;
      return resultHeader.affectedRows;
    });
  }

  /**
   * Get table row count
   */
  static async getRowCount(
    table: string,
    whereClause?: string,
    whereParams?: any[]
  ) {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    let params: any[] = [];

    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
      params = whereParams || [];
    }

    const rows = await this.query(sql, params) as { count: number }[];
    return rows[0]?.count || 0;
  }

  /**
   * Batch insert with transaction
   */
  static async batchInsert(table: string, dataArray: Record<string, any>[]) {
    if (!dataArray.length) return [];

    const columns = Object.keys(dataArray[0]).join(", ");
    const placeholders = Object.keys(dataArray[0])
      .map(() => "?")
      .join(", ");
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    return this.executeInTransaction(async () => {
      const insertIds = [];
      for (const data of dataArray) {
        const values = Object.values(data);
        const [queryResult] = await db.execute(sql, values);
        const resultHeader = queryResult as ResultSetHeader;
        insertIds.push(resultHeader.insertId);
      }
      return insertIds;
    });
  }
}

export default DatabaseService;
