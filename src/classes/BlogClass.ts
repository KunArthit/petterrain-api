// import {
//   BlogPostModel,
//   BlogPostMediaModel,
//   BlogCategoryModel,
// } from "../models/BlogModel";
// import db from "@/core/database";

// interface BlogPostWithRelations extends BlogPostModel {
//   category?: BlogCategoryModel;
//   media?: BlogPostMediaModel[];
//   author?: {
//     user_id: number;
//     username: string;
//     first_name: string;
//     last_name: string;
//   };
// }

// class BlogService {
//   async getAllPosts(): Promise<BlogPostWithRelations[]> {
//     const conn = await db.getConnection();
//     try {
//       // First, get all posts with their categories
//       const postsQuery = `
//           SELECT
//           p.post_id,
// 					bp_trans.title AS title,
// 					bp_trans.slug AS slug,
// 					bp_trans.content AS content,
// 					bp_trans.excerpt AS excerpt,
// 					p.author_id,
// 					p.category_id,
// 					p.featured_image,
// 					p.status,
// 					p.published_at,
// 					p.created_at,
// 					p.updated_at,
//           c.category_id AS category_category_id,
//           c.name AS category_name,
//           c.slug AS category_slug,
//           c.description AS category_description,
//           u.user_id AS author_user_id,
//           u.username AS author_username,
//           u.first_name AS author_first_name,
//           u.last_name AS author_last_name
//         FROM
//           blog_posts p
//         LEFT JOIN
//           blog_categories c ON p.category_id = c.category_id
//         LEFT JOIN
//           users u ON p.author_id = u.user_id
// 				LEFT JOIN
// 					blog_posts_translations bp_trans
// 					ON p.post_id = bp_trans.blog_post_id
//         ORDER BY
//           p.published_at DESC, p.created_at DESC;
//       `;

//       const [postsRows] = await conn.query(postsQuery);

//       // Initialize result array with posts and categories
//       const posts: BlogPostWithRelations[] = (postsRows as any[]).map((row) => {
//         // Extract post data
//         const post: BlogPostWithRelations = {
//           post_id: row.post_id,
//           title: row.title,
//           slug: row.slug,
//           content: row.content,
//           excerpt: row.excerpt,
//           category_id: row.category_id,
//           author_id: row.author_id,
//           featured_image: row.featured_image,
//           status: row.status,
//           published_at: row.published_at,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           media: [],
//         };

//         // Add category data if present
//         if (row.category_category_id) {
//           post.category = {
//             category_id: row.category_category_id,
//             name: row.category_name,
//             slug: row.category_slug,
//             description: row.category_description,
//           };
//         }

//         // Add author data if present
//         if (row.author_user_id) {
//           post.author = {
//             user_id: row.author_user_id,
//             username: row.author_username,
//             first_name: row.author_first_name,
//             last_name: row.author_last_name,
//           };
//         }

//         return post;
//       });

//       // If we have posts, get all media for those posts
//       if (posts.length > 0) {
//         const postIds = posts.map((post) => post.post_id);

//         const mediaQuery = `
//           SELECT *
//           FROM blog_post_media
//           WHERE post_id IN (?)
//           ORDER BY display_order ASC;
//         `;

//         const [mediaRows] = await conn.query(mediaQuery, [postIds]);

//         // Assign media to their corresponding posts
//         (mediaRows as BlogPostMediaModel[]).forEach((media) => {
//           const post = posts.find((p) => p.post_id === media.post_id);
//           if (post && post.media) {
//             post.media.push(media);
//           }
//         });
//       }

//       return posts;
//     } catch (error) {
//       console.error("Failed to fetch blog posts:", error);
//       throw new Error("Failed to fetch blog posts");
//     } finally {
//       conn.release();
//     }
//   }

//   /**
//    * Get a single blog post with all its related data
//    * @param postIdOrSlug The post ID or slug
//    * @returns The blog post with its relations or null if not found
//    */
//   async getPostByIdOrSlug(
//     postIdOrSlug: number | string
//   ): Promise<BlogPostWithRelations[]> {
//     const conn = await db.getConnection();
//     try {
//       const isId =
//         typeof postIdOrSlug === "number" || !isNaN(Number(postIdOrSlug));

//       const postQuery = `
//         SELECT
//           p.post_id,
// 					bp_trans.title AS title,
// 					bp_trans.slug AS slug,
// 					bp_trans.content AS content,
// 					bp_trans.excerpt AS excerpt,
// 					p.author_id,
// 					p.category_id,
// 					p.featured_image,
// 					p.status,
// 					p.published_at,
// 					p.created_at,
// 					p.updated_at,
//           c.category_id AS category_category_id,
//           c.name AS category_name,
//           c.slug AS category_slug,
//           c.description AS category_description,
//           u.user_id AS author_user_id,
//           u.username AS author_username,
//           u.first_name AS author_first_name,
//           u.last_name AS author_last_name
//         FROM
//           blog_posts p
//         LEFT JOIN
//           blog_categories c ON p.category_id = c.category_id
//         LEFT JOIN
//           users u ON p.author_id = u.user_id
//         LEFT JOIN
// 					blog_posts_translations bp_trans
// 					ON p.post_id = bp_trans.blog_post_id
//         WHERE
//           ${isId ? "p.post_id = ?" : "p.slug = ?"}
//       `;

//       const [postRows] = await conn.query(postQuery, [postIdOrSlug]);

//       if (!(postRows as any[]).length) {
//         return [];
//       }

//       const posts: BlogPostWithRelations[] = (postRows as any[]).map((row) => {
//         const post: BlogPostWithRelations = {
//           post_id: row.post_id,
//           title: row.title,
//           slug: row.slug,
//           content: row.content,
//           excerpt: row.excerpt,
//           category_id: row.category_id,
//           author_id: row.author_id,
//           featured_image: row.featured_image,
//           status: row.status,
//           published_at: row.published_at,
//           created_at: row.created_at,
//           updated_at: row.updated_at,
//           media: [],
//         };
//         if (row.category_category_id) {
//           post.category = {
//             category_id: row.category_category_id,
//             name: row.category_name,
//             slug: row.category_slug,
//             description: row.category_description,
//           };
//         }
//         if (row.author_user_id) {
//           post.author = {
//             user_id: row.author_user_id,
//             username: row.author_username,
//             first_name: row.author_first_name,
//             last_name: row.author_last_name,
//           };
//         }
//         return post;
//       });

//       // Get media for all posts
//       if (posts.length > 0) {
//         const postIds = posts.map((post) => post.post_id);
//         const mediaQuery = `
//           SELECT *
//           FROM blog_post_media
//           WHERE post_id IN (${postIds.map(() => "?").join(",")})
//           ORDER BY display_order ASC;
//         `;
//         const [mediaRows] = await conn.query(mediaQuery, postIds);
//         (mediaRows as BlogPostMediaModel[]).forEach((media) => {
//           const post = posts.find((p) => p.post_id === media.post_id);
//           if (post && post.media) post.media.push(media);
//         });
//       }

//       return posts;
//     } catch (error) {
//       console.error("Failed to fetch blog post:", error);
//       throw new Error("Failed to fetch blog post");
//     } finally {
//       conn.release();
//     }
//   }

//   /**
//    * Update an existing blog post
//    * @param postId The ID of the blog post to update
//    * @param data Fields to update
//    * @returns true if updated, false if not found
//    */
//   async updatePost(
//     postId: number,
//     data: Omit<BlogPostModel, "post_id" | "created_at" | "updated_at">
//   ): Promise<boolean> {
//     const conn = await db.getConnection();
//     try {
//       // ตรวจสอบว่ามีโพสต์นี้อยู่จริง
//       const [existingRows] = await conn.query(
//         "SELECT post_id FROM blog_posts WHERE post_id = ?",
//         [postId]
//       );
//       if ((existingRows as any[]).length === 0) {
//         return false; // ไม่พบโพสต์
//       }

//       const query = `
//           UPDATE blog_posts
//           SET
//             title = ?,
//             slug = ?,
//             content = ?,
//             excerpt = ?,
//             category_id = ?,
//             author_id = ?,
//             featured_image = ?,
//             status = ?,
//             published_at = ?,
//             updated_at = NOW()
//           WHERE post_id = ?
//         `;

//       await conn.query(query, [
//         data.title,
//         data.slug,
//         data.content,
//         data.excerpt,
//         data.category_id,
//         data.author_id,
//         data.featured_image,
//         data.status,
//         data.published_at,
//         postId,
//       ]);

//       return true;
//     } catch (error) {
//       console.error("Failed to update blog post:", error);
//       throw new Error("Failed to update blog post");
//     } finally {
//       conn.release();
//     }
//   }

//   async deletePost(postId: number): Promise<boolean> {
//     const conn = await db.getConnection();
//     try {
//       // ตรวจสอบว่ามีโพสต์นี้อยู่จริง
//       const [existingRows] = await conn.query(
//         "SELECT post_id FROM blog_posts WHERE post_id = ?",
//         [postId]
//       );
//       if ((existingRows as any[]).length === 0) {
//         return false; // ไม่พบโพสต์
//       }

//       // ลบโพสต์
//       const query = "DELETE FROM blog_posts WHERE post_id = ?";
//       await conn.query(query, [postId]);

//       return true;
//     } catch (error) {
//       console.error("Failed to delete blog post:", error);
//       throw new Error("Failed to delete blog post");
//     } finally {
//       conn.release();
//     }
//   }

//   /**
//    * Create a new blog post
//    * @param post Blog post data without auto-generated fields
//    * @returns The ID of the newly created post
//    */
//   // async createPost(
//   //   post: Omit<BlogPostModel, "post_id" | "created_at" | "updated_at">
//   // ): Promise<number> {
//   //   const query = `
//   //     INSERT INTO blog_posts
//   //       (title, slug, content, excerpt, category_id, author_id, featured_image, status, published_at)
//   //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
//   //   `;

//   //   const queryLang = `
//   //     INSERT INTO blog_posts_translations
//   //       (blog_post_id, lang, title, slug, content, excerpt)
//   //     VALUES (?, ?, ?, ?, ?, ?);
//   //   `;

//   //   const conn = await db.getConnection();
//   //   try {
//   //     // ✅ ตรวจสอบว่า author_id มีอยู่ใน users
//   //     const [userRows] = await conn.query(
//   //       "SELECT user_id FROM users WHERE user_id = ?",
//   //       [post.author_id]
//   //     );
//   //     if ((userRows as any[]).length === 0) {
//   //       throw new Error(`Author with user_id=${post.author_id} does not exist`);
//   //     }

//   //     const [result] = await conn.query(query, [
//   //       post.title,
//   //       post.slug,
//   //       post.content,
//   //       post.excerpt,
//   //       post.category_id,
//   //       post.author_id,
//   //       post.featured_image,
//   //       post.status,
//   //       post.published_at,
//   //     ]);
//   //     return (result as any).insertId;
//   //   } catch (error) {
//   //     console.error("Failed to create blog post:", error);
//   //     throw new Error("Failed to create blog post");
//   //   } finally {
//   //     conn.release();
//   //   }
//   // }

//   // async createPost(post: {
//   //   category_id: number;
//   //   author_id: number;
//   //   featured_image?: string | null;
//   //   status: string;
//   //   published_at?: Date | null;
//   //   translations: {
//   //     lang: string;
//   //     title: string;
//   //     slug: string;
//   //     content: string;
//   //     excerpt?: string | null;
//   //   }[];
//   // }): Promise<number> {
//   //   const conn = await db.getConnection();

//   //   try {
//   //     await conn.beginTransaction();

//   //     // ✅ ตรวจสอบว่า author_id มีอยู่ใน users
//   //     const [userRows] = await conn.query(
//   //       "SELECT user_id FROM users WHERE user_id = ?",
//   //       [post.author_id]
//   //     );
//   //     if ((userRows as any[]).length === 0) {
//   //       throw new Error(`Author with user_id=${post.author_id} does not exist`);
//   //     }

//   //     // ✅ insert main blog post
//   //     // ใช้ภาษาแรกจาก translations เป็น default (สำหรับ table หลัก)
//   //     const defaultLang = post.translations[0];
//   //     const mainQuery = `
//   //     INSERT INTO blog_posts
//   //       (title, slug, content, excerpt, category_id, author_id, featured_image, status, published_at, created_at, updated_at)
//   //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
//   //   `;
//   //     const [mainResult] = await conn.query(mainQuery, [
//   //       defaultLang.title,
//   //       defaultLang.slug,
//   //       defaultLang.content,
//   //       defaultLang.excerpt ?? null,
//   //       post.category_id,
//   //       post.author_id,
//   //       post.featured_image ?? null,
//   //       post.status,
//   //       post.published_at ?? null,
//   //     ]);

//   //     const postId = (mainResult as any).insertId;
//   //     if (!postId) throw new Error("Failed to insert blog_posts");

//   //     // ✅ insert translations
//   //     const translationQuery = `
//   //     INSERT INTO blog_posts_translations
//   //       (blog_post_id, lang, title, slug, content, excerpt, created_at, updated_at)
//   //     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW());
//   //   `;

//   //     for (const t of post.translations) {
//   //       await conn.query(translationQuery, [
//   //         postId,
//   //         t.lang,
//   //         t.title,
//   //         t.slug,
//   //         t.content,
//   //         t.excerpt ?? null,
//   //       ]);
//   //     }

//   //     await conn.commit();
//   //     console.log(
//   //       `✅ Blog post ${postId} created with ${post.translations.length} translations`
//   //     );
//   //     return postId;
//   //   } catch (error) {
//   //     await conn.rollback();
//   //     console.error("Failed to create blog post:", error);
//   //     throw new Error("Failed to create blog post");
//   //   } finally {
//   //     conn.release();
//   //   }
//   // }

//   async createPost(post: {
//     category_id: number | null;
//     author_id: number;
//     featured_image?: string | null;
//     status: string;
//     published_at?: Date | null;
//     translations: {
//       lang: string;
//       title: string;
//       slug: string;
//       content: string;
//       excerpt?: string | null;
//     }[];
//   }): Promise<number> {
//     const conn = await db.getConnection();

//     try {
//       await conn.beginTransaction();

//       // ✅ ใช้ translation ตัวแรกเป็น main post
//       const defaultTranslation = post.translations[0];
//       const { title, slug, content, excerpt } = defaultTranslation;

//       // ✅ Insert main blog post
//       const mainQuery = `
//       INSERT INTO blog_posts
//       (title, slug, content, excerpt, category_id, author_id, featured_image, status, published_at, created_at, updated_at)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
//     `;
//       const [mainResult] = await conn.query(mainQuery, [
//         title,
//         slug,
//         content,
//         excerpt ?? null,
//         post.category_id,
//         post.author_id,
//         post.featured_image ?? null,
//         post.status,
//         post.published_at ?? null,
//       ]);

//       const postId = (mainResult as any).insertId;
//       if (!postId) throw new Error("Insert into blog_posts failed");

//       // ✅ Insert translations
//       const translationQuery = `
//       INSERT INTO blog_posts_translations
//       (blog_post_id, lang, title, slug, content, excerpt)
//       VALUES (?, ?, ?, ?, ?, ?);
//     `;

//       for (const t of post.translations) {
//         await conn.query(translationQuery, [
//           postId,
//           t.lang,
//           t.title,
//           t.slug,
//           t.content,
//           t.excerpt ?? null,
//         ]);
//       }

//       await conn.commit();
//       console.log(`✅ Blog post created successfully (ID: ${postId})`);
//       return postId;
//     } catch (error) {
//       await conn.rollback();
//       console.error("❌ Failed to create blog post:", error);
//       throw new Error("Failed to create blog post");
//     } finally {
//       conn.release();
//     }
//   }

//   /**
//    * Add media content to a blog post
//    * @param media Blog post media data without auto-generated ID
//    * @returns The ID of the newly created media
//    */
//   async addPostMedia(
//     media: Omit<BlogPostMediaModel, "media_id">
//   ): Promise<number> {
//     const query = `
//     INSERT INTO blog_post_media (post_id, media_type, media_url, caption, display_order)
//     VALUES (?, ?, ?, ?, ?);
//   `;
//     const conn = await db.getConnection();
//     try {
//       const [result] = await conn.query(query, [
//         media.post_id,
//         media.media_type,
//         media.media_url,
//         media.caption,
//         media.display_order,
//       ]);
//       return (result as any).insertId;
//     } catch (error) {
//       console.error("Failed to add blog post media:", error);
//       throw new Error("Failed to add blog post media");
//     } finally {
//       conn.release();
//     }
//   }

//   /**
//    * Add multiple media items to a blog post
//    * @param postId The ID of the blog post
//    * @param mediaItems Array of media items to add
//    * @returns Array of created media IDs
//    */
//   async addMultiplePostMedia(
//     postId: number,
//     mediaItems: Omit<BlogPostMediaModel, "media_id" | "post_id">[]
//   ): Promise<number[]> {
//     const mediaIds: number[] = [];

//     for (const item of mediaItems) {
//       const mediaId = await this.addPostMedia({
//         ...item,
//         post_id: postId,
//       });
//       mediaIds.push(mediaId);
//     }

//     return mediaIds;
//   }
// }

// export default new BlogService();

import {
  BlogPostModel,
  BlogPostMediaModel,
  BlogCategoryModel,
} from "../models/BlogModel";
import db from "@/core/database";

interface BlogTranslation {
  id: number;
  blog_post_id: number;
  lang: "th" | "en";
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
}

interface BlogPostWithRelations
  extends Omit<BlogPostModel, "title" | "slug" | "content" | "excerpt"> {
  translations: BlogTranslation[];
  category?: BlogCategoryModel;
  media?: BlogPostMediaModel[];
  author?: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

class BlogService {
  async getAllPosts(): Promise<BlogPostWithRelations[]> {
    const conn = await db.getConnection();
    try {
      // First, get all posts with their categories
      const postsQuery = `
        SELECT
          p.post_id,
          p.author_id,
          p.category_id,
          p.featured_image,
          p.status,
          p.published_at,
          p.created_at,
          p.updated_at,
          c.category_id AS category_category_id,
          c.name AS category_name,
          c.slug AS category_slug,
          c.description AS category_description,
          u.user_id AS author_user_id,
          u.username AS author_username,
          u.first_name AS author_first_name,
          u.last_name AS author_last_name
        FROM
          blog_posts p
        LEFT JOIN
          blog_categories c ON p.category_id = c.category_id
        LEFT JOIN
          users u ON p.author_id = u.user_id
        ORDER BY
          p.published_at DESC, p.created_at DESC;
      `;

      const [postsRows] = await conn.query(postsQuery);

      // Get all translations
      const translationsQuery = `
        SELECT
          id,
          blog_post_id,
          lang,
          title,
          slug,
          content,
          excerpt
        FROM blog_posts_translations
        ORDER BY blog_post_id, lang;
      `;

      const [translationsRows] = await conn.query(translationsQuery);

      // Group translations by post_id
      const translationsByPostId = new Map<number, BlogTranslation[]>();
      (translationsRows as any[]).forEach((trans) => {
        if (!translationsByPostId.has(trans.blog_post_id)) {
          translationsByPostId.set(trans.blog_post_id, []);
        }
        translationsByPostId.get(trans.blog_post_id)!.push({
          id: trans.id,
          blog_post_id: trans.blog_post_id,
          lang: trans.lang,
          title: trans.title,
          slug: trans.slug,
          content: trans.content,
          excerpt: trans.excerpt,
        });
      });

      // Build posts with translations
      const posts: BlogPostWithRelations[] = (postsRows as any[]).map((row) => {
        const post: BlogPostWithRelations = {
          post_id: row.post_id,
          category_id: row.category_id,
          author_id: row.author_id,
          featured_image: row.featured_image,
          status: row.status,
          published_at: row.published_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
          translations: translationsByPostId.get(row.post_id) || [],
          media: [],
        };

        // Add category data if present
        if (row.category_category_id) {
          post.category = {
            category_id: row.category_category_id,
            name: row.category_name,
            slug: row.category_slug,
            description: row.category_description,
          };
        }

        // Add author data if present
        if (row.author_user_id) {
          post.author = {
            user_id: row.author_user_id,
            username: row.author_username,
            first_name: row.author_first_name,
            last_name: row.author_last_name,
          };
        }

        return post;
      });

      // Get all media for posts
      if (posts.length > 0) {
        const postIds = posts.map((post) => post.post_id);

        const mediaQuery = `
          SELECT *
          FROM blog_post_media
          WHERE post_id IN (?)
          ORDER BY display_order ASC;
        `;

        const [mediaRows] = await conn.query(mediaQuery, [postIds]);

        // Assign media to their corresponding posts
        (mediaRows as BlogPostMediaModel[]).forEach((media) => {
          const post = posts.find((p) => p.post_id === media.post_id);
          if (post && post.media) {
            post.media.push(media);
          }
        });
      }

      return posts;
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      throw new Error("Failed to fetch blog posts");
    } finally {
      conn.release();
    }
  }

  async getPostByIdOrSlug(
    postIdOrSlug: number | string
  ): Promise<BlogPostWithRelations[]> {
    const conn = await db.getConnection();
    try {
      const isId =
        typeof postIdOrSlug === "number" || !isNaN(Number(postIdOrSlug));

      const postQuery = `
        SELECT 
          p.post_id,
          p.author_id,
          p.category_id,
          p.featured_image,
          p.status,
          p.published_at,
          p.created_at,
          p.updated_at,
          c.category_id AS category_category_id,
          c.name AS category_name,
          c.slug AS category_slug,
          c.description AS category_description,
          u.user_id AS author_user_id,
          u.username AS author_username,
          u.first_name AS author_first_name,
          u.last_name AS author_last_name
        FROM 
          blog_posts p
        LEFT JOIN 
          blog_categories c ON p.category_id = c.category_id
        LEFT JOIN
          users u ON p.author_id = u.user_id
        WHERE 
          ${
            isId
              ? "p.post_id = ?"
              : "p.post_id IN (SELECT blog_post_id FROM blog_posts_translations WHERE slug = ?)"
          }
      `;

      const [postRows] = await conn.query(postQuery, [postIdOrSlug]);

      if (!(postRows as any[]).length) {
        return [];
      }

      const postIds = (postRows as any[]).map((row: any) => row.post_id);

      // Get translations
      const translationsQuery = `
        SELECT 
          id,
          blog_post_id,
          lang,
          title,
          slug,
          content,
          excerpt
        FROM blog_posts_translations
        WHERE blog_post_id IN (?)
        ORDER BY lang;
      `;

      const [translationsRows] = await conn.query(translationsQuery, [postIds]);

      // Group translations
      const translationsByPostId = new Map<number, BlogTranslation[]>();
      (translationsRows as any[]).forEach((trans) => {
        if (!translationsByPostId.has(trans.blog_post_id)) {
          translationsByPostId.set(trans.blog_post_id, []);
        }
        translationsByPostId.get(trans.blog_post_id)!.push({
          id: trans.id,
          blog_post_id: trans.blog_post_id,
          lang: trans.lang,
          title: trans.title,
          slug: trans.slug,
          content: trans.content,
          excerpt: trans.excerpt,
        });
      });

      const posts: BlogPostWithRelations[] = (postRows as any[]).map((row) => {
        const post: BlogPostWithRelations = {
          post_id: row.post_id,
          category_id: row.category_id,
          author_id: row.author_id,
          featured_image: row.featured_image,
          status: row.status,
          published_at: row.published_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
          translations: translationsByPostId.get(row.post_id) || [],
          media: [],
        };

        if (row.category_category_id) {
          post.category = {
            category_id: row.category_category_id,
            name: row.category_name,
            slug: row.category_slug,
            description: row.category_description,
          };
        }

        if (row.author_user_id) {
          post.author = {
            user_id: row.author_user_id,
            username: row.author_username,
            first_name: row.author_first_name,
            last_name: row.author_last_name,
          };
        }

        return post;
      });

      // Get media
      if (posts.length > 0) {
        const mediaQuery = `
          SELECT * 
          FROM blog_post_media 
          WHERE post_id IN (?) 
          ORDER BY display_order ASC;
        `;
        const [mediaRows] = await conn.query(mediaQuery, [postIds]);
        (mediaRows as BlogPostMediaModel[]).forEach((media) => {
          const post = posts.find((p) => p.post_id === media.post_id);
          if (post && post.media) post.media.push(media);
        });
      }

      return posts;
    } catch (error) {
      console.error("Failed to fetch blog post:", error);
      throw new Error("Failed to fetch blog post");
    } finally {
      conn.release();
    }
  }


  async updatePost(
    postId: number,
    data: {
      category_id?: number | null;
      author_id: number;
      featured_image?: string | null;
      status: string;
      published_at?: Date | null;
    },
    translations: {
      id?: number;
      lang: string;
      title: string;
      slug: string;
      content: string;
      excerpt?: string | null;
    }[]
  ): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Check if post exists
      const [existingRows] = await conn.query(
        "SELECT post_id FROM blog_posts WHERE post_id = ?",
        [postId]
      );
      if ((existingRows as any[]).length === 0) {
        await conn.rollback();
        return false;
      }

      // 2. Update main blog_posts table (without title/slug/content)
      const updatePostQuery = `
      UPDATE blog_posts 
      SET 
        category_id = ?, 
        author_id = ?, 
        featured_image = ?, 
        status = ?, 
        published_at = ?, 
        updated_at = NOW()
      WHERE post_id = ?
    `;

      await conn.query(updatePostQuery, [
        data.category_id,
        data.author_id,
        data.featured_image,
        data.status,
        data.published_at,
        postId,
      ]);

      // 3. Update or Insert translations
      for (const trans of translations) {
        // Check if translation exists
        const [existingTrans] = await conn.query(
          "SELECT id FROM blog_posts_translations WHERE blog_post_id = ? AND lang = ?",
          [postId, trans.lang]
        );

        if ((existingTrans as any[]).length > 0) {
          // Update existing translation
          await conn.query(
            `UPDATE blog_posts_translations 
              SET title = ?, slug = ?, content = ?, excerpt = ?
              WHERE blog_post_id = ? AND lang = ?`,
            [
              trans.title,
              trans.slug,
              trans.content,
              trans.excerpt,
              postId,
              trans.lang,
            ]
          );
        } else {
          // Insert new translation
          await conn.query(
            `INSERT INTO blog_posts_translations 
           (blog_post_id, lang, title, slug, content, excerpt, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              postId,
              trans.lang,
              trans.title,
              trans.slug,
              trans.content,
              trans.excerpt,
            ]
          );
        }
      }

      await conn.commit();
      console.log(`✅ Blog post ${postId} updated successfully`);
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Failed to update blog post:", error);
      throw new Error("Failed to update blog post");
    } finally {
      conn.release();
    }
  }

  async deletePost(postId: number): Promise<boolean> {
    const conn = await db.getConnection();
    try {
      const [existingRows] = await conn.query(
        "SELECT post_id FROM blog_posts WHERE post_id = ?",
        [postId]
      );
      if ((existingRows as any[]).length === 0) {
        return false;
      }

      const query = "DELETE FROM blog_posts WHERE post_id = ?";
      await conn.query(query, [postId]);

      return true;
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      throw new Error("Failed to delete blog post");
    } finally {
      conn.release();
    }
  }

  async createPost(post: {
    category_id: number | null;
    author_id: number;
    featured_image?: string | null;
    status: string;
    published_at?: Date | null;
    translations: {
      lang: string;
      title: string;
      slug: string;
      content: string;
      excerpt?: string | null;
    }[];
  }): Promise<number> {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const defaultTranslation = post.translations[0];
      const { title, slug, content, excerpt } = defaultTranslation;

      const mainQuery = `
        INSERT INTO blog_posts 
        (title, slug, content, excerpt, category_id, author_id, featured_image, status, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());
      `;
      const [mainResult] = await conn.query(mainQuery, [
        title,
        slug,
        content,
        excerpt ?? null,
        post.category_id,
        post.author_id,
        post.featured_image ?? null,
        post.status,
        post.published_at ?? null,
      ]);

      const postId = (mainResult as any).insertId;
      if (!postId) throw new Error("Insert into blog_posts failed");

      const translationQuery = `
        INSERT INTO blog_posts_translations
        (blog_post_id, lang, title, slug, content, excerpt)
        VALUES (?, ?, ?, ?, ?, ?);
      `;

      for (const t of post.translations) {
        await conn.query(translationQuery, [
          postId,
          t.lang,
          t.title,
          t.slug,
          t.content,
          t.excerpt ?? null,
        ]);
      }

      await conn.commit();
      console.log(`✅ Blog post created successfully (ID: ${postId})`);
      return postId;
    } catch (error) {
      await conn.rollback();
      console.error("❌ Failed to create blog post:", error);
      throw new Error("Failed to create blog post");
    } finally {
      conn.release();
    }
  }

  async addPostMedia(
    media: Omit<BlogPostMediaModel, "media_id">
  ): Promise<number> {
    const query = `
      INSERT INTO blog_post_media (post_id, media_type, media_url, caption, display_order)
      VALUES (?, ?, ?, ?, ?);
    `;
    const conn = await db.getConnection();
    try {
      const [result] = await conn.query(query, [
        media.post_id,
        media.media_type,
        media.media_url,
        media.caption,
        media.display_order,
      ]);
      return (result as any).insertId;
    } catch (error) {
      console.error("Failed to add blog post media:", error);
      throw new Error("Failed to add blog post media");
    } finally {
      conn.release();
    }
  }

  async addMultiplePostMedia(
    postId: number,
    mediaItems: Omit<BlogPostMediaModel, "media_id" | "post_id">[]
  ): Promise<number[]> {
    const mediaIds: number[] = [];

    for (const item of mediaItems) {
      const mediaId = await this.addPostMedia({
        ...item,
        post_id: postId,
      });
      mediaIds.push(mediaId);
    }

    return mediaIds;
  }
}

export default new BlogService();
