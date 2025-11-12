import db from "@/core/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export type FileManagerPath = {
  name: string;
  id: string;
};

export type FileManagerItem = {
  id: string;
  folderId?: string;
  name: string;
  createdBy: string;
  createdAt: string;
  modifiedAt: string;
  size: string;
  type: string;
  contents: string;
  description: string;
};

export class MediaService {
  static async getMediaCounts(): Promise<Record<string, number>> {
    const queries = {
      blogPostMedia: `SELECT COUNT(*) as count FROM blog_post_media;`,
      productImages: `SELECT COUNT(*) as count FROM product_images;`,
      productVideos: `SELECT COUNT(*) as count FROM product_videos;`,
      projectMedia: `SELECT COUNT(*) as count FROM project_media;`,
      solutionCategories: `SELECT COUNT(*) as count FROM solution_categories;`,
    };

    const conn = await db.getConnection();

    try {
      type QueryResult = RowDataPacket & { count: number };

      const results = await Promise.all([
        conn.query<QueryResult[]>(queries.blogPostMedia),
        conn.query<QueryResult[]>(queries.productImages),
        conn.query<QueryResult[]>(queries.productVideos),
        conn.query<QueryResult[]>(queries.projectMedia),
        conn.query<QueryResult[]>(queries.solutionCategories),
      ]);

      return {
        blogPostMedia: results[0][0][0].count,
        productImages: results[1][0][0].count,
        productVideos: results[2][0][0].count,
        projectMedia: results[3][0][0].count,
        solutionCategories: results[4][0][0].count,
      };
    } catch (error) {
      console.error("Failed to fetch media counts:", error);
      throw new Error("Failed to fetch media counts");
    } finally {
      conn.release();
    }
  }

  static async getAllFolderItems(): Promise<FileManagerItem[]> {
    // Create virtual folders based on your media types
    return [
      {
        id: "blog_media",
        name: "Blog Media",
        createdBy: "system",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        size: "0",
        type: "folder",
        contents: "",
        description: "Blog post media files",
      },
      {
        id: "product_images",
        name: "Product Images",
        createdBy: "system",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        size: "0",
        type: "folder",
        contents: "",
        description: "Product image files",
      },
      {
        id: "product_videos",
        name: "Product Videos",
        createdBy: "system",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        size: "0",
        type: "folder",
        contents: "",
        description: "Product video files",
      },
      {
        id: "project_media",
        name: "Project Media",
        createdBy: "system",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        size: "0",
        type: "folder",
        contents: "",
        description: "Project media files",
      },
      {
        id: "solution_categories",
        name: "Solution Categories",
        createdBy: "system",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        size: "0",
        type: "folder",
        contents: "",
        description: "Solution category images",
      },
    ];
  }

  // Get items by folder ID (category)
  static async getFolderItems(folderId?: string): Promise<FileManagerItem[]> {
    if (!folderId || folderId === "root") {
      // Root view - return the virtual folders
      return this.getAllFolderItems();
    }

    const conn = await db.getConnection();

    try {
      let query: string;
      let params: any[] = [];

      // Based on the folder ID, query the appropriate table
      if (folderId === "blog_media") {
        query = `
          SELECT 
            CONCAT('blog_', media_id) as id,
            'blog_media' as folderId,
            media_url as name,
            'system' as createdBy,
            NOW() as createdAt,
            NOW() as modifiedAt,
            '0' as size,
            media_type as type,
            '' as contents,
            IFNULL(caption, '') as description,
            display_order
          FROM blog_post_media
          ORDER BY display_order
        `;
      } else if (folderId === "product_images") {
        query = `
          SELECT 
            CONCAT('prod_img_', image_id) as id,
            'product_images' as folderId,
            image_url as name,
            'system' as createdBy,
            NOW() as createdAt,
            NOW() as modifiedAt,
            '0' as size,
            'image' as type,
            '' as contents,
            IF(is_primary=1, 'Primary Image', '') as description,
            display_order
          FROM product_images
          ORDER BY display_order
        `;
      } else if (folderId === "product_videos") {
        query = `
          SELECT 
            CONCAT('prod_vid_', video_id) as id,
            'product_videos' as folderId,
            video_url as name,
            'system' as createdBy,
            NOW() as createdAt,
            NOW() as modifiedAt,
            '0' as size,
            video_type as type,
            '' as contents,
            '' as description,
            display_order
          FROM product_videos
          ORDER BY display_order
        `;
      } else if (folderId === "project_media") {
        query = `
          SELECT 
            CONCAT('proj_', media_id) as id,
            'project_media' as folderId,
            media_url as name,
            'system' as createdBy,
            NOW() as createdAt,
            NOW() as modifiedAt,
            '0' as size,
            media_type as type,
            '' as contents,
            IFNULL(caption, '') as description,
            display_order
          FROM project_media
          ORDER BY display_order
        `;
      } else if (folderId === "solution_categories") {
        query = `
          SELECT 
            CONCAT('solution_', category_id) as id,
            'solution_categories' as folderId,
            image_url as name,
            'system' as createdBy,
            NOW() as createdAt,
            NOW() as modifiedAt,
            '0' as size,
            'image' as type,
            IFNULL(name, '') as contents,
            IFNULL(description, '') as description,
            category_id as display_order
          FROM solution_categories
          WHERE active = 1
          ORDER BY name
        `;
      } else {
        // Unknown folder ID
        return [];
      }

      const [rows] = await conn.query<RowDataPacket[]>(query, params);

      // Convert raw data to FileManagerItem format
      return rows.map((row) => ({
        id: row.id,
        folderId: row.folderId,
        name: row.name,
        createdBy: row.createdBy,
        createdAt: new Date(row.createdAt).toISOString(),
        modifiedAt: new Date(row.modifiedAt).toISOString(),
        size: String(row.size || "0"),
        type: row.type,
        contents: row.contents || "",
        description: row.description || "",
      }));
    } catch (error) {
      console.error(`Failed to fetch items for folder ${folderId}:`, error);
      throw new Error(`Failed to fetch items for folder ${folderId}`);
    } finally {
      conn.release();
    }
  }

  // Update a media item
  static async updateFolder(
    itemId: string,
    item: FileManagerItem
  ): Promise<boolean> {
    // Extract type and ID from the prefixed ID
    const [prefix, rawId] = itemId.split("_");
    let id = rawId;
    let type = prefix;

    // Handle special case for product media
    if (prefix === "prod") {
      if (itemId.includes("img_")) {
        type = "prod_img";
        id = itemId.split("prod_img_")[1];
      } else if (itemId.includes("vid_")) {
        type = "prod_vid";
        id = itemId.split("prod_vid_")[1];
      }
    }

    if (!type || !id) {
      throw new Error(`Invalid item ID: ${itemId}`);
    }

    const conn = await db.getConnection();

    try {
      let query: string;
      let params: any[];

      // Update the appropriate table based on the item type
      if (type === "blog") {
        query = `
          UPDATE blog_post_media
          SET 
            media_url = ?,
            caption = ?
          WHERE media_id = ?
        `;
        params = [item.name, item.description, id];
      } else if (type === "prod_img") {
        query = `
          UPDATE product_images
          SET 
            image_url = ?,
            is_primary = ?
          WHERE image_id = ?
        `;
        // If description contains 'Primary Image', set is_primary to 1
        const isPrimary = item.description.includes("Primary Image") ? 1 : 0;
        params = [item.name, isPrimary, id];
      } else if (type === "prod_vid") {
        query = `
          UPDATE product_videos
          SET 
            video_url = ?,
            video_type = ?
          WHERE video_id = ?
        `;
        params = [item.name, item.type, id];
      } else if (type === "proj") {
        query = `
          UPDATE project_media
          SET 
            media_url = ?,
            caption = ?,
            media_type = ?
          WHERE media_id = ?
        `;
        params = [item.name, item.description, item.type, id];
      } else if (type === "solution") {
        query = `
          UPDATE solution_categories
          SET 
            image_url = ?,
            name = ?,
            description = ?
          WHERE category_id = ?
        `;
        params = [item.name, item.contents, item.description, id];
      } else {
        // Cannot update virtual folders
        if (item.type === "folder") {
          // No changes to virtual folders
          return true;
        }
        return false;
      }

      const [result] = await conn.query<ResultSetHeader>(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Failed to update item ${itemId}:`, error);
      throw new Error(`Failed to update item ${itemId}`);
    } finally {
      conn.release();
    }
  }

  // Delete a media item
  static async deleteFolder(itemId: string): Promise<boolean> {
    // Extract type and ID from the prefixed ID
    const [prefix, rawId] = itemId.split("_");
    let id = rawId;
    let type = prefix;

    // Handle special case for product media
    if (prefix === "prod") {
      if (itemId.includes("img_")) {
        type = "prod_img";
        id = itemId.split("prod_img_")[1];
      } else if (itemId.includes("vid_")) {
        type = "prod_vid";
        id = itemId.split("prod_vid_")[1];
      }
    }

    if (!type || !id) {
      throw new Error(`Invalid item ID: ${itemId}`);
    }

    // Cannot delete virtual folders
    if (
      itemId === "blog_media" ||
      itemId === "product_images" ||
      itemId === "product_videos" ||
      itemId === "project_media" ||
      itemId === "solution_categories"
    ) {
      throw new Error("Cannot delete system folders");
    }

    const conn = await db.getConnection();

    try {
      let query: string;
      let params: any[];

      // Delete from the appropriate table based on the item type
      if (type === "blog") {
        query = `DELETE FROM blog_post_media WHERE media_id = ?`;
        params = [id];
      } else if (type === "prod_img") {
        query = `DELETE FROM product_images WHERE image_id = ?`;
        params = [id];
      } else if (type === "prod_vid") {
        query = `DELETE FROM product_videos WHERE video_id = ?`;
        params = [id];
      } else if (type === "proj") {
        query = `DELETE FROM project_media WHERE media_id = ?`;
        params = [id];
      } else if (type === "solution") {
        // For solution categories, we'll set active to 0 instead of deleting
        query = `UPDATE solution_categories SET active = 0 WHERE category_id = ?`;
        params = [id];
      } else {
        return false;
      }

      const [result] = await conn.query<ResultSetHeader>(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Failed to delete item ${itemId}:`, error);
      throw new Error(`Failed to delete item ${itemId}`);
    } finally {
      conn.release();
    }
  }

  // Get folder path (breadcrumbs)
  static async getFolderPath(folderId: string): Promise<FileManagerPath[]> {
    // For virtual folder structure, simply return the path
    const root: FileManagerPath = { id: "root", name: "Media Library" };

    // If it's one of our main folders
    if (folderId === "blog_media") {
      return [root, { id: "blog_media", name: "Blog Media" }];
    } else if (folderId === "product_images") {
      return [root, { id: "product_images", name: "Product Images" }];
    } else if (folderId === "product_videos") {
      return [root, { id: "product_videos", name: "Product Videos" }];
    } else if (folderId === "project_media") {
      return [root, { id: "project_media", name: "Project Media" }];
    } else if (folderId === "solution_categories") {
      return [root, { id: "solution_categories", name: "Solution Categories" }];
    }

    // If it's an item within a folder, include the parent folder
    const [type] = folderId.split("_");

    if (type === "blog") {
      return [
        root,
        { id: "blog_media", name: "Blog Media" },
        { id: folderId, name: "Media Item" },
      ];
    } else if (folderId.startsWith("prod_img_")) {
      return [
        root,
        { id: "product_images", name: "Product Images" },
        { id: folderId, name: "Image Item" },
      ];
    } else if (folderId.startsWith("prod_vid_")) {
      return [
        root,
        { id: "product_videos", name: "Product Videos" },
        { id: folderId, name: "Video Item" },
      ];
    } else if (type === "proj") {
      return [
        root,
        { id: "project_media", name: "Project Media" },
        { id: folderId, name: "Media Item" },
      ];
    } else if (type === "solution") {
      return [
        root,
        { id: "solution_categories", name: "Solution Categories" },
        { id: folderId, name: "Solution Category" },
      ];
    }

    // Default if something is not recognized
    return [root];
  }
}
