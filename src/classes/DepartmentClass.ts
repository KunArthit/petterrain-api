import { DepartmentModel } from "../models/DepartmentModel";
import db from "@/core/database";

class DepartmentService {
  // Get all departments
  async getAllDepartments(): Promise<DepartmentModel[]> {
    const query = `SELECT * FROM departments;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as DepartmentModel[];
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      throw new Error("Failed to fetch departments");
    } finally {
      conn.release();
    }
  }

  // Get department by ID
  async getDepartmentById(
    department_id: number
  ): Promise<DepartmentModel | null> {
    const query = `SELECT * FROM departments WHERE department_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: any = await conn.query(query, [department_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch department:", error);
      throw new Error("Failed to fetch department");
    } finally {
      conn.release();
    }
  }

  // Create a new department
  async createDepartment(
    department: Omit<DepartmentModel, "department_id">
  ): Promise<number> {
    const query = `
      INSERT INTO departments (department_name, description)
      VALUES (?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        department.department_name,
        department.description,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create department:", error);
      throw new Error("Failed to create department");
    } finally {
      conn.release();
    }
  }

  // Update department
  async updateDepartment(
    department_id: number,
    department: Partial<Omit<DepartmentModel, "department_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE departments
      SET department_name=?, description=?
      WHERE department_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        department.department_name,
        department.description,
        department_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update department:", error);
      throw new Error("Failed to update department");
    } finally {
      conn.release();
    }
  }

  // Delete department
  async deleteDepartment(department_id: number): Promise<boolean> {
    const query = `DELETE FROM departments WHERE department_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [department_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete department:", error);
      throw new Error("Failed to delete department");
    } finally {
      conn.release();
    }
  }
}

export default new DepartmentService();
