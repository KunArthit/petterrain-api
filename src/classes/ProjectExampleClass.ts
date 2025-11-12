import { ProjectExampleModel } from "../models/ProjectExampleModel";
import db from "@/core/database";

class ProjectExampleService {
  // Get all project examples
  async getAllProjects(): Promise<ProjectExampleModel[]> {
    const query = `SELECT * FROM project_examples ORDER BY completed_date DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ProjectExampleModel[];
    } catch (error) {
      console.error("Failed to fetch project examples:", error);
      throw new Error("Failed to fetch project examples");
    } finally {
      conn.release();
    }
  }

  // Get project example by ID
  async getProjectById(
    project_id: number
  ): Promise<ProjectExampleModel | null> {
    const query = `SELECT * FROM project_examples WHERE project_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [project_id]);
      return Array.isArray(rows) && rows.length
        ? (rows[0] as ProjectExampleModel)
        : null;
    } catch (error) {
      console.error("Failed to fetch project example:", error);
      throw new Error("Failed to fetch project example");
    } finally {
      conn.release();
    }
  }

  // Get projects by Solution ID
  async getProjectsBySolutionId(
    solution_id: number
  ): Promise<ProjectExampleModel[]> {
    const query = `SELECT * FROM project_examples WHERE solution_id = ? ORDER BY completed_date DESC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [solution_id]);
      return rows as ProjectExampleModel[];
    } catch (error) {
      console.error("Failed to fetch project examples by solution ID:", error);
      throw new Error("Failed to fetch project examples by solution ID");
    } finally {
      conn.release();
    }
  }

  // Create a new project example
  async createProject(
    project: Omit<
      ProjectExampleModel,
      "project_id" | "created_at" | "updated_at"
    >
  ): Promise<number> {
    const query = `
      INSERT INTO project_examples (solution_id, title, description, client_name, completed_date, featured_image, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        project.solution_id,
        project.title,
        project.description,
        project.client_name,
        project.completed_date,
        project.featured_image,
        project.is_active,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create project example:", error);
      throw new Error("Failed to create project example");
    } finally {
      conn.release();
    }
  }

  // Update project example
  async updateProject(
    project_id: number,
    project: Partial<Omit<ProjectExampleModel, "project_id" | "created_at">>
  ): Promise<boolean> {
    const query = `
      UPDATE project_examples
      SET solution_id=?, title=?, description=?, client_name=?, completed_date=?, featured_image=?, is_active=?, updated_at=NOW()
      WHERE project_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        project.solution_id,
        project.title,
        project.description,
        project.client_name,
        project.completed_date,
        project.featured_image,
        project.is_active,
        project_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update project example:", error);
      throw new Error("Failed to update project example");
    } finally {
      conn.release();
    }
  }

  // Delete project example
  async deleteProject(project_id: number): Promise<boolean> {
    const query = `DELETE FROM project_examples WHERE project_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [project_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete project example:", error);
      throw new Error("Failed to delete project example");
    } finally {
      conn.release();
    }
  }
}

export default new ProjectExampleService();
