import { Elysia, t } from "elysia";
import {
  MediaService,
  FileManagerItem,
  FileManagerPath,
} from "../classes/MediaClass";

const MediaController = new Elysia({
  prefix: "/media",
  tags: ["Media"],
})
  // Get media counts (keeping your existing endpoint)
  .get("/media-counts", async () => {
    try {
      const counts = await MediaService.getMediaCounts();
      return counts;
    } catch (error) {
      throw new Error("Failed to fetch media counts");
    }
  })

  // File Manager endpoints
  .group("/file-manager", (app) =>
    app
      // Get file manager items
      .get(
        "/items",
        async ({ query }) => {
          try {
            if (query.type === "folder") {
              return await MediaService.getAllFolderItems();
            } else if (query.folderId) {
              return await MediaService.getFolderItems(
                query.folderId as string
              );
            } else {
              return await MediaService.getFolderItems();
            }
          } catch (error) {
            throw new Error("Failed to fetch file manager items");
          }
        },
        {
          query: t.Object({
            type: t.Optional(t.String()),
            folderId: t.Optional(t.String()),
          }),
        }
      )

      // Get folder path (breadcrumbs)
      .get(
        "/path/:folderId",
        async ({ params }) => {
          try {
            return await MediaService.getFolderPath(params.folderId);
          } catch (error) {
            throw new Error(
              `Failed to fetch path for folder ${params.folderId}`
            );
          }
        },
        {
          params: t.Object({
            folderId: t.String(),
          }),
        }
      )

      // Update media item
      .put(
        "/items/:itemId",
        async ({ params, body }) => {
          try {
            const success = await MediaService.updateFolder(params.itemId, {
              ...body,
              contents: body.contents ?? "",
              description: body.description ?? "",
            });
            if (!success) {
              throw new Error(`Item ${params.itemId} not found`);
            }
            return { success: true };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to update item: ${errorMessage}`);
          }
        },
        {
          params: t.Object({
            itemId: t.String(),
          }),
          body: t.Object({
            id: t.String(),
            name: t.String(),
            description: t.Optional(t.String()),
            contents: t.Optional(t.String()),
            folderId: t.Optional(t.String()),
            createdBy: t.String(),
            createdAt: t.String(),
            modifiedAt: t.String(),
            size: t.String(),
            type: t.String(),
          }),
        }
      )

      // Delete media item
      .delete(
        "/items/:itemId",
        async ({ params }) => {
          try {
            const success = await MediaService.deleteFolder(params.itemId);
            if (!success) {
              throw new Error(`Item ${params.itemId} not found`);
            }
            return { success: true };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to delete item: ${errorMessage}`);
          }
        },
        {
          params: t.Object({
            itemId: t.String(),
          }),
        }
      )
  );

export default MediaController;
