// import { Elysia, t } from "elysia";
// import BlogService from "../classes/BlogClass";

// const blogController = new Elysia({
//   prefix: "/blog",
//   tags: ["Blog"],
// })
//   // Get all blog posts with their relationships
//   .get("/", async () => {
//     try {
//       const posts = await BlogService.getAllPosts();
//       return posts;
//     } catch (error) {
//       console.error("Get all posts error:", error);
//       throw new Error("Failed to fetch blog posts");
//     }
//   })

//   // Check slug availability - NEW ENDPOINT
//   .get(
//     "/check-slug/:slug",
//     async ({ params, set }) => {
//       try {
//         const existingPost = await BlogService.getPostByIdOrSlug(params.slug);

//         if (existingPost) {
//           // Slug already exists
//           set.status = 409; // Conflict
//           return {
//             available: false,
//             message: "This URL slug is already taken",
//           };
//         }

//         // Slug is available
//         return {
//           available: true,
//           message: "Slug is available",
//         };
//       } catch (error) {
//         console.error("Check slug error:", error);
//         set.status = 500;
//         return {
//           available: false,
//           message: "Error checking slug availability",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         slug: t.String(),
//       }),
//     }
//   )

//   // Get a specific blog post by ID or slug
//   .get(
//     "/:idOrSlug",
//     async ({ params, set }) => {
//       try {
//         const idOrSlug = isNaN(Number(params.idOrSlug))
//           ? params.idOrSlug
//           : Number(params.idOrSlug);

//         const post = await BlogService.getPostByIdOrSlug(idOrSlug);

//         if (!post) {
//           set.status = 404;
//           return { error: "Blog post not found" };
//         }

//         return post;
//       } catch (error) {
//         console.error("Get post by ID/slug error:", error);
//         set.status = 500;
//         return { error: "Failed to fetch blog post" };
//       }
//     },
//     {
//       params: t.Object({
//         idOrSlug: t.String(),
//       }),
//     }
//   )

//   .post(
//     "/",
//     async ({ body, set }) => {
//       try {
//         // 🧩 ใช้ slug ของ translation ตัวแรกเป็น slug หลัก (default)
//         let mainTranslation = body.translations[0];
//         let slug = mainTranslation.slug.trim().toLowerCase();

//         // 🔎 ตรวจ slug ซ้ำใน DB
//         const existingPost = await BlogService.getPostByIdOrSlug(slug);
//         if (existingPost) {
//           // 🔁 ถ้าซ้ำ → generate slug ใหม่อัตโนมัติ
//           const uniqueSuffix = Date.now().toString();
//           slug = `${slug}-${uniqueSuffix}`;
//           console.warn(`⚠️ Slug ซ้ำ — ปรับเป็น slug ใหม่: ${slug}`);
//         }

//         // ✅ สร้าง post พร้อม translations
//         const postId = await BlogService.createPost({
//           category_id: body.category_id ?? null,
//           author_id: body.author_id,
//           featured_image: body.featured_image ?? null,
//           status: body.status,
//           published_at: body.published_at ? new Date(body.published_at) : null,
//           translations: body.translations.map((t, i) => ({
//             ...t,
//             // ✅ อัปเดต slug ภาษา default ให้ตรงกับ slug ที่ generate ใหม่
//             slug: i === 0 ? slug : t.slug,
//           })),
//         });

//         set.status = 201;
//         return {
//           message: "✅ Blog post created successfully",
//           id: postId,
//           post_id: postId,
//           slug,
//         };
//       } catch (error) {
//         console.error("❌ Create Blog Error:", error);

//         // 🧱 กรณี unique constraint จาก DB (กัน fallback)
//         if (
//           error instanceof Error &&
//           error.message.toLowerCase().includes("duplicate")
//         ) {
//           const newSlug = `${body.translations[0].slug}-${Date.now()}`;
//           console.warn(`⚠️ Duplicate slug caught by DB — using ${newSlug}`);
//           set.status = 201;
//           return {
//             message: "Blog post created with auto-generated slug (retry).",
//             slug: newSlug,
//           };
//         }

//         set.status = 500;
//         return {
//           error: "Failed to create blog post",
//           message:
//             error instanceof Error
//               ? error.message
//               : "An unexpected error occurred while creating the blog post",
//         };
//       }
//     },
//     {
//       body: t.Object({
//         category_id: t.Number(),
//         author_id: t.Number(),
//         featured_image: t.Optional(t.String()),
//         status: t.String(),
//         published_at: t.Optional(t.Union([t.String(), t.Null()])),
//         translations: t.Array(
//           t.Object({
//             lang: t.String(), // เช่น "th", "en"
//             title: t.String(),
//             slug: t.String(),
//             content: t.String(),
//             excerpt: t.Optional(t.Union([t.String(), t.Null()])),
//           })
//         ),
//       }),
//     }
//   )

//   // Update an existing blog post
//   .patch(
//     "/:postId",
//     async ({ params, body, set }) => {
//       try {
//         const postId = Number(params.postId);

//         // Check if slug already exists (excluding current post)
//         if (body.slug) {
//           const existingPost: any[0] = await BlogService.getPostByIdOrSlug(
//             body.slug
//           );
//           if (existingPost && existingPost.post_id !== postId) {
//             set.status = 409;
//             return {
//               error: "Slug already exists",
//               message:
//                 "This URL slug is already taken. Please choose a different one.",
//               field: "slug",
//             };
//           }
//         }

//         const updated = await BlogService.updatePost(postId, {
//           ...body,
//           excerpt: body.excerpt ?? null,
//           category_id: body.category_id ?? null,
//           featured_image: body.featured_image ?? null,
//           published_at: body.published_at ? new Date(body.published_at) : null,
//         });

//         if (!updated) {
//           set.status = 404;
//           return { error: "Blog post not found" };
//         }

//         return { message: "Blog post updated successfully" };
//       } catch (error) {
//         console.error("Update Blog Error:", error);

//         // Check if it's a unique constraint error
//         if (
//           error instanceof Error &&
//           error.message.toLowerCase().includes("unique")
//         ) {
//           set.status = 409;
//           return {
//             error: "Slug already exists",
//             message:
//               "This URL slug is already taken. Please choose a different one.",
//             field: "slug",
//           };
//         }

//         set.status = 500;
//         return {
//           error: "Failed to update blog post",
//           message:
//             error instanceof Error
//               ? error.message
//               : "An unexpected error occurred while updating the blog post",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         postId: t.String(),
//       }),
//       body: t.Object({
//         title: t.String(),
//         slug: t.String(),
//         content: t.String(),
//         excerpt: t.Optional(t.Union([t.String(), t.Null()])),
//         category_id: t.Optional(t.Number()),
//         author_id: t.Number(),
//         featured_image: t.Optional(t.String()),
//         status: t.String(),
//         published_at: t.Optional(t.Union([t.String(), t.Null()])),
//       }),
//     }
//   )

//   // Delete an existing blog post
//   .delete(
//     "/:postId",
//     async ({ params, set }) => {
//       try {
//         const postId = Number(params.postId);
//         const deleted = await BlogService.deletePost(postId);

//         if (!deleted) {
//           set.status = 404;
//           return { error: "Blog post not found" };
//         }

//         return { message: "Blog post deleted successfully" };
//       } catch (error) {
//         console.error("Delete Blog Error:", error);
//         set.status = 500;
//         return {
//           error: "Failed to delete blog post",
//           message:
//             error instanceof Error
//               ? error.message
//               : "An unexpected error occurred while deleting the blog post",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         postId: t.String(),
//       }),
//     }
//   )

//   // Add media to an existing blog post
//   .post(
//     "/:postId/media",
//     async ({ params, body, set }) => {
//       try {
//         const postId = parseInt(params.postId);

//         // Check if post exists
//         const post = await BlogService.getPostByIdOrSlug(postId);
//         if (!post) {
//           set.status = 404;
//           return { error: "Blog post not found" };
//         }

//         if (Array.isArray(body)) {
//           const mediaIds = await BlogService.addMultiplePostMedia(
//             postId,
//             body.map((item) => ({
//               media_type: item.media_type,
//               media_url: item.media_url,
//               caption: item.caption ?? null,
//               display_order: item.display_order,
//             }))
//           );
//           return {
//             message: "Blog post media added successfully",
//             media_ids: mediaIds,
//           };
//         } else {
//           const mediaId = await BlogService.addPostMedia({
//             post_id: postId,
//             media_type: body.media_type,
//             media_url: body.media_url,
//             caption: body.caption ?? null,
//             display_order: body.display_order,
//           });
//           return {
//             message: "Blog post media added successfully",
//             media_id: mediaId,
//           };
//         }
//       } catch (error) {
//         console.error("Add media error:", error);
//         set.status = 500;
//         return {
//           error: "Failed to add blog post media",
//           message:
//             error instanceof Error
//               ? error.message
//               : "An unexpected error occurred while adding media",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         postId: t.String(),
//       }),
//       body: t.Union([
//         t.Object({
//           media_type: t.String(),
//           media_url: t.String(),
//           caption: t.Optional(t.Union([t.String(), t.Null()])),
//           display_order: t.Number(),
//         }),
//         t.Array(
//           t.Object({
//             media_type: t.String(),
//             media_url: t.String(),
//             caption: t.Optional(t.Union([t.String(), t.Null()])),
//             display_order: t.Number(),
//           })
//         ),
//       ]),
//     }
//   );

// export default blogController;

import { Elysia, t } from "elysia";
import BlogService from "../classes/BlogClass";

const blogController = new Elysia({
  prefix: "/blog",
  tags: ["Blog"],
})
  // Get all blog posts with their relationships
  .get("/", async () => {
    try {
      const posts = await BlogService.getAllPosts();
      return { success: true, data: posts };
    } catch (error) {
      console.error("Get all posts error:", error);
      throw new Error("Failed to fetch blog posts");
    }
  })

  // Check slug availability
  .get(
    "/check-slug/:slug",
    async ({ params, set }) => {
      try {
        const existingPost = await BlogService.getPostByIdOrSlug(params.slug);

        if (existingPost) {
          set.status = 409;
          return {
            available: false,
            message: "This URL slug is already taken",
          };
        }

        return {
          available: true,
          message: "Slug is available",
        };
      } catch (error) {
        console.error("Check slug error:", error);
        set.status = 500;
        return {
          available: false,
          message: "Error checking slug availability",
        };
      }
    },
    {
      params: t.Object({
        slug: t.String(),
      }),
    }
  )

  // Get a specific blog post by ID or slug
  .get(
    "/:idOrSlug",
    async ({ params, set }) => {
      try {
        const idOrSlug = isNaN(Number(params.idOrSlug))
          ? params.idOrSlug
          : Number(params.idOrSlug);

        const post = await BlogService.getPostByIdOrSlug(idOrSlug);

        if (!post) {
          set.status = 404;
          return { error: "Blog post not found" };
        }

        return post;
      } catch (error) {
        console.error("Get post by ID/slug error:", error);
        set.status = 500;
        return { error: "Failed to fetch blog post" };
      }
    },
    {
      params: t.Object({
        idOrSlug: t.String(),
      }),
    }
  )

  // Create a new blog post
  .post(
    "/",
    async ({ body, set }) => {
      try {
        let mainTranslation = body.translations[0];
        let slug = mainTranslation.slug.trim().toLowerCase();

        // Check slug duplication
        const existingPost = await BlogService.getPostByIdOrSlug(slug);
        if (existingPost) {
          const uniqueSuffix = Date.now().toString();
          slug = `${slug}-${uniqueSuffix}`;
          console.warn(`⚠️ Slug ซ้ำ — ปรับเป็น slug ใหม่: ${slug}`);
        }

        const postId = await BlogService.createPost({
          category_id: body.category_id ?? null,
          author_id: body.author_id,
          featured_image: body.featured_image ?? null,
          status: body.status,
          published_at: body.published_at ? new Date(body.published_at) : null,
          translations: body.translations.map((t, i) => ({
            ...t,
            slug: i === 0 ? slug : t.slug,
          })),
        });

        set.status = 201;
        return {
          message: "✅ Blog post created successfully",
          id: postId,
          post_id: postId,
          slug,
        };
      } catch (error) {
        console.error("❌ Create Blog Error:", error);

        if (
          error instanceof Error &&
          error.message.toLowerCase().includes("duplicate")
        ) {
          const newSlug = `${body.translations[0].slug}-${Date.now()}`;
          console.warn(`⚠️ Duplicate slug caught by DB — using ${newSlug}`);
          set.status = 201;
          return {
            message: "Blog post created with auto-generated slug (retry).",
            slug: newSlug,
          };
        }

        set.status = 500;
        return {
          error: "Failed to create blog post",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while creating the blog post",
        };
      }
    },
    {
      body: t.Object({
        category_id: t.Number(),
        author_id: t.Number(),
        featured_image: t.Optional(t.String()),
        status: t.String(),
        published_at: t.Optional(t.Union([t.String(), t.Null()])),
        translations: t.Array(
          t.Object({
            lang: t.String(),
            title: t.String(),
            slug: t.String(),
            content: t.String(),
            excerpt: t.Optional(t.Union([t.String(), t.Null()])),
          })
        ),
      }),
    }
  )

  // Update an existing blog post with translations
  .put(
    "/:postId",
    async ({ params, body, set }) => {
      try {
        const postId = Number(params.postId);

        // Check if post exists
        const existingPost = await BlogService.getPostByIdOrSlug(postId);
        if (!existingPost) {
          set.status = 404;
          return { error: "Blog post not found" };
        }

        // Update post with translations
        const updated = await BlogService.updatePost(
          postId,
          {
            category_id: body.category_id ?? null,
            author_id: body.author_id,
            featured_image: body.featured_image ?? null,
            status: body.status,
            published_at: body.published_at
              ? new Date(body.published_at)
              : null,
          },
          body.translations
        );

        if (!updated) {
          set.status = 404;
          return { error: "Blog post not found" };
        }

        return {
          success: true,
          message: "Blog post updated successfully",
        };
      } catch (error) {
        console.error("Update Blog Error:", error);
        set.status = 500;
        return {
          error: "Failed to update blog post",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while updating the blog post",
        };
      }
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
      body: t.Object({
        category_id: t.Optional(t.Union([t.Number(), t.Null()])),
        author_id: t.Number(),
        featured_image: t.Optional(t.Union([t.String(), t.Null()])),
        status: t.String(),
        published_at: t.Optional(t.Union([t.String(), t.Null()])),
        translations: t.Array(
          t.Object({
            id: t.Optional(t.Number()), // For updating existing translations
            lang: t.String(),
            title: t.String(),
            slug: t.String(),
            content: t.String(),
            excerpt: t.Optional(t.Union([t.String(), t.Null()])),
          })
        ),
      }),
    }
  )

  // Keep PATCH for backward compatibility (legacy format)
  .patch(
    "/:postId",
    async ({ params, body, set }) => {
      try {
        const postId = Number(params.postId);

        // Check if slug already exists (excluding current post)
        if (body.slug) {
          const existingPost: any = await BlogService.getPostByIdOrSlug(
            body.slug
          );
          if (existingPost && existingPost.post_id !== postId) {
            set.status = 409;
            return {
              error: "Slug already exists",
              message:
                "This URL slug is already taken. Please choose a different one.",
              field: "slug",
            };
          }
        }

        const updated = await BlogService.updatePost(postId, {
          ...body,
          excerpt: body.excerpt ?? null,
          category_id: body.category_id ?? null,
          featured_image: body.featured_image ?? null,
          published_at: body.published_at ? new Date(body.published_at) : null,
        });

        if (!updated) {
          set.status = 404;
          return { error: "Blog post not found" };
        }

        return { message: "Blog post updated successfully" };
      } catch (error) {
        console.error("Update Blog Error:", error);

        if (
          error instanceof Error &&
          error.message.toLowerCase().includes("unique")
        ) {
          set.status = 409;
          return {
            error: "Slug already exists",
            message:
              "This URL slug is already taken. Please choose a different one.",
            field: "slug",
          };
        }

        set.status = 500;
        return {
          error: "Failed to update blog post",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while updating the blog post",
        };
      }
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
      body: t.Object({
        title: t.String(),
        slug: t.String(),
        content: t.String(),
        excerpt: t.Optional(t.Union([t.String(), t.Null()])),
        category_id: t.Optional(t.Number()),
        author_id: t.Number(),
        featured_image: t.Optional(t.String()),
        status: t.String(),
        published_at: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )

  // Delete an existing blog post
  .delete(
    "/:postId",
    async ({ params, set }) => {
      try {
        const postId = Number(params.postId);
        const deleted = await BlogService.deletePost(postId);

        if (!deleted) {
          set.status = 404;
          return { error: "Blog post not found" };
        }

        return { message: "Blog post deleted successfully" };
      } catch (error) {
        console.error("Delete Blog Error:", error);
        set.status = 500;
        return {
          error: "Failed to delete blog post",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while deleting the blog post",
        };
      }
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
    }
  )

  // Add media to an existing blog post
  .post(
    "/:postId/media",
    async ({ params, body, set }) => {
      try {
        const postId = parseInt(params.postId);

        const post = await BlogService.getPostByIdOrSlug(postId);
        if (!post) {
          set.status = 404;
          return { error: "Blog post not found" };
        }

        if (Array.isArray(body)) {
          const mediaIds = await BlogService.addMultiplePostMedia(
            postId,
            body.map((item) => ({
              media_type: item.media_type,
              media_url: item.media_url,
              caption: item.caption ?? null,
              display_order: item.display_order,
            }))
          );
          return {
            message: "Blog post media added successfully",
            media_ids: mediaIds,
          };
        } else {
          const mediaId = await BlogService.addPostMedia({
            post_id: postId,
            media_type: body.media_type,
            media_url: body.media_url,
            caption: body.caption ?? null,
            display_order: body.display_order,
          });
          return {
            message: "Blog post media added successfully",
            media_id: mediaId,
          };
        }
      } catch (error) {
        console.error("Add media error:", error);
        set.status = 500;
        return {
          error: "Failed to add blog post media",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while adding media",
        };
      }
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
      body: t.Union([
        t.Object({
          media_type: t.String(),
          media_url: t.String(),
          caption: t.Optional(t.Union([t.String(), t.Null()])),
          display_order: t.Number(),
        }),
        t.Array(
          t.Object({
            media_type: t.String(),
            media_url: t.String(),
            caption: t.Optional(t.Union([t.String(), t.Null()])),
            display_order: t.Number(),
          })
        ),
      ]),
    }
  );

export default blogController;
