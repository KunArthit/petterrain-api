import db from "@/core/database";

export interface ThemeModel {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  created_at: string;
  updated_at: string;
}

class ThemeService {
  // Get theme by name (useful for supporting multiple themes)
  async getThemeByName(name: string = "default"): Promise<ThemeModel | null> {
    const query = `SELECT * FROM themes WHERE name = ?;`;
    const conn = await db.getConnection();
    try {
      const [rows]: any[] = await conn.query(query, [name]);
      return rows.length ? (rows[0] as ThemeModel) : null;
    } catch (error) {
      console.error("Failed to fetch theme:", error);
      throw new Error("Failed to fetch theme");
    } finally {
      conn.release();
    }
  }

  // Update theme settings by name (normally you have only one theme, so name = "default")
  async updateTheme(
    name: string,
    theme: Partial<Omit<ThemeModel, "id" | "created_at" | "updated_at">>
  ): Promise<boolean> {
    const query = `UPDATE themes SET primaryColor = ?, secondaryColor = ?, backgroundColor = ? WHERE name = ?;`;
    const conn = await db.getConnection();
    try {
      const [result]: any = await conn.query(query, [
        theme.primaryColor,
        theme.secondaryColor,
        theme.backgroundColor,
        name,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Failed to update theme:", error);
      throw new Error("Failed to update theme");
    } finally {
      conn.release();
    }
  }

  // Create a new theme
  async createTheme(
    theme: Omit<ThemeModel, "id" | "created_at" | "updated_at">
  ): Promise<number> {
    const query = `INSERT INTO themes (name, primaryColor, secondaryColor, backgroundColor) VALUES (?, ?, ?, ?);`;
    const conn = await db.getConnection();
    try {
      const [result]: any = await conn.query(query, [
        theme.name,
        theme.primaryColor,
        theme.secondaryColor,
        theme.backgroundColor,
      ]);
      return result.insertId;
    } catch (error) {
      console.error("Failed to create theme:", error);
      throw new Error("Failed to create theme");
    } finally {
      conn.release();
    }
  }

  // Delete a theme by name
  async deleteTheme(name: string): Promise<boolean> {
    const query = `DELETE FROM themes WHERE name = ?;`;
    const conn = await db.getConnection();
    try {
      const [result]: any = await conn.query(query, [name]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete theme:", error);
      throw new Error("Failed to delete theme");
    } finally {
      conn.release();
    }
  }
}

export default new ThemeService();
