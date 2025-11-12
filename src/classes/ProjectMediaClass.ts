import { ProjectMediaModel } from "../models/ProjectMediaModel";
import db from "@/core/database";

class ProjectMediaService {
  // Get all project media
  async getAllMedia(): Promise<ProjectMediaModel[]> {
    const query = `SELECT * FROM project_media ORDER BY display_order ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query);
      return rows as ProjectMediaModel[];
    } catch (error) {
      console.error("Failed to fetch project media:", error);
      throw new Error("Failed to fetch project media");
    } finally {
      conn.release();
    }
  }

  // Get project media by ID
  async getMediaById(media_id: number): Promise<ProjectMediaModel | null> {
    const query = `SELECT * FROM project_media WHERE media_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: [any[], any] = await conn.query(query, [media_id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Failed to fetch project media:", error);
      throw new Error("Failed to fetch project media");
    } finally {
      conn.release();
    }
  }

  // Get media by Project ID
  async getMediaByProjectId(project_id: number): Promise<ProjectMediaModel[]> {
    const query = `SELECT * FROM project_media WHERE project_id = ? ORDER BY display_order ASC;`;
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.query(query, [project_id]);
      return rows as ProjectMediaModel[];
    } catch (error) {
      console.error("Failed to fetch media by project ID:", error);
      throw new Error("Failed to fetch media by project ID");
    } finally {
      conn.release();
    }
  }

  // Create a new project media entry
  async createMedia(
    media: Omit<ProjectMediaModel, "media_id">
  ): Promise<number> {
    const query = `
      INSERT INTO project_media (project_id, media_type, media_url, caption, display_order)
      VALUES (?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        media.project_id,
        media.media_type,
        media.media_url,
        media.caption,
        media.display_order,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to create project media:", error);
      throw new Error("Failed to create project media");
    } finally {
      conn.release();
    }
  }

  // Update project media
  async updateMedia(
    media_id: number,
    media: Partial<Omit<ProjectMediaModel, "media_id">>
  ): Promise<boolean> {
    const query = `
      UPDATE project_media
      SET project_id=?, media_type=?, media_url=?, caption=?, display_order=?
      WHERE media_id=?;
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        media.project_id,
        media.media_type,
        media.media_url,
        media.caption,
        media.display_order,
        media_id,
      ]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to update project media:", error);
      throw new Error("Failed to update project media");
    } finally {
      conn.release();
    }
  }

  // Delete project media
  async deleteMedia(media_id: number): Promise<boolean> {
    const query = `DELETE FROM project_media WHERE media_id = ?;`;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [media_id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete project media:", error);
      throw new Error("Failed to delete project media");
    } finally {
      conn.release();
    }
  }
}

export default new ProjectMediaService();
