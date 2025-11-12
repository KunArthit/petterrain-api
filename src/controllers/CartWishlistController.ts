import { Elysia, t } from "elysia";
import CartWishlistService from "../classes/CartWishlistClass";
import { CartWishlistModel, CartWishlistType } from "../models/CartWishListModel";




const cartWishlistController = new Elysia({
  prefix: "/cart-wishlist",
  tags: ["Cart & Wishlist"],
})
  // Get all items
  .get("/", async () => {
    try {
      return await CartWishlistService.getAllCartWishlist();
    } catch (error) {
      console.error("Failed to fetch all cart/wishlist items:", error);
      return { error: "Failed to fetch all items" };
    }
  })

  // Get item by ID
  .get("/:id", async ({ params, error }) => {
    try {
      const id = Number(params.id);
      if (isNaN(id)) {
        return error(400, "Invalid ID format");
      }
      const item = await CartWishlistService.findById(id);
      if (!item) {
        return error(404, "Item not found");
      }
      return item;
    } catch (err) {
      console.error("Failed to fetch item by ID:", err);
      return error(500, "Failed to fetch item");
    }
  })

  // Get items by User ID, with optional type filter
  .get("/user/:userId", async ({ params, query, error }) => {
    try {
      const userId = Number(params.userId);
      if (isNaN(userId)) {
        return error(400, "Invalid User ID format");
      }
      const type = query.type as CartWishlistType | undefined;
      if (type && type !== 'cart' && type !== 'wishlist') {
         return error(400, "Invalid type parameter. Must be 'cart' or 'wishlist'.");
      }
      return await CartWishlistService.findByUserId(userId, type);
    } catch (err) {
      console.error("Failed to fetch items by User ID:", err);
      return error(500, "Failed to fetch items for user");
    }
  })

  // Create a new item
  .post(
    "/",
    async ({ body, error }) => {
      try {
        const newItemId = await CartWishlistService.create(body);
        return { message: "Item created successfully", id: newItemId };
      } catch (err) {
        console.error("Failed to create item:", err);
        return error(500, "Failed to create item");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        product_id: t.Number(),
        quantity: t.Number({ minimum: 1 }),
        type: t.Enum(CartWishlistType),
      }),
    }
  )

  // Update an item by ID
  .put(
    "/:id",
    async ({ params, body, error }) => {
      try {
        const id = Number(params.id);
        if (isNaN(id)) {
          return error(400, "Invalid ID format");
        }
        const success = await CartWishlistService.update(id, body);
        if (!success) {
          return error(404, "Item not found or update failed");
        }
        return { message: "Item updated successfully" };
      } catch (err) {
        console.error("Failed to update item:", err);
        return error(500, "Failed to update item");
      }
    },
    {
      body: t.Partial(
        t.Object({
          user_id: t.Number(),
          product_id: t.Number(),
          quantity: t.Number({ minimum: 1 }),
          type: t.Enum(CartWishlistType),
        })
      ),
    }
  )

  // Delete an item by ID
  .delete("/:id", async ({ params, error }) => {
    try {
      const id = Number(params.id);
      if (isNaN(id)) {
        return error(400, "Invalid ID format");
      }
      const success = await CartWishlistService.deleteById(id);
      if (!success) {
        return error(404, "Item not found or deletion failed");
      }
      return { message: "Item deleted successfully" };
    } catch (err) {
      console.error("Failed to delete item by ID:", err);
      return error(500, "Failed to delete item");
    }
  })

  // Delete items by User ID, with optional type filter
  .delete("/user/:userId", async ({ params, query, error }) => {
    try {
      const userId = Number(params.userId);
      if (isNaN(userId)) {
        return error(400, "Invalid User ID format");
      }
       const type = query.type as CartWishlistType | undefined;
       if (type && type !== 'cart' && type !== 'wishlist') {
         return error(400, "Invalid type parameter. Must be 'cart' or 'wishlist'.");
       }
      const success = await CartWishlistService.deleteByUserId(userId, type);
      if (!success) {
        // This might just mean the user had no items to delete, which isn't an error.
        return { message: "No items found for the user to delete, or deletion failed." };
      }
      return { message: "User items deleted successfully" };
    } catch (err) {
      console.error("Failed to delete items by User ID:", err);
      return error(500, "Failed to delete items for user");
    }
  });

export default cartWishlistController;
