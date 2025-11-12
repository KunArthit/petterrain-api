import { Elysia, t } from "elysia";
import QuotationItemService from "../classes/QuotationItemClass";
import { QuotationItemModel } from "@/models/QuotationItemModel";

const quotationItemController = new Elysia({
  prefix: "/quotation-items",
  tags: ["Quotation items"],
})
  // Get all quotation items
  .get("/", async () => {
    try {
      return await QuotationItemService.getAllQuotationItems();
    } catch (error) {
      throw new Error("Failed to fetch quotation items");
    }
  })

  // Get quotation item by ID
  .get("/:id", async ({ params }) => {
    try {
      const item = await QuotationItemService.getQuotationItemById(
        Number(params.id)
      );
      if (!item) throw new Error("Quotation item not found");
      return item;
    } catch (error) {
      throw new Error("Failed to fetch quotation item");
    }
  })

  // Get items by Quotation ID
  .get("/quotation/:quotation_id", async ({ params }) => {
    try {
      return await QuotationItemService.getItemsByQuotationId(
        Number(params.quotation_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch items for quotation");
    }
  })

  // Create quotation item
  .post(
    "/",
    async ({ body }) => {
      try {
        const itemId = await QuotationItemService.createQuotationItem(body);
        return { message: "Quotation item created", item_id: itemId };
      } catch (error) {
        throw new Error("Failed to create quotation item");
      }
    },
    {
      body: t.Object({
        quotation_id: t.Number(),
        product_id: t.Number(),
        quantity: t.Number(),
        unit_price: t.Number(),
        subtotal: t.Number(),
      }),
    }
  )

  // Update quotation item
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<QuotationItemModel, "item_id">>;
    }) => {
      try {
        const success = await QuotationItemService.updateQuotationItem(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Quotation item update failed");
        return { message: "Quotation item updated" };
      } catch (error) {
        throw new Error("Failed to update quotation item");
      }
    }
  )

  // Delete quotation item
  .delete("/:id", async ({ params }) => {
    try {
      const success = await QuotationItemService.deleteQuotationItem(
        Number(params.id)
      );
      if (!success) throw new Error("Quotation item deletion failed");
      return { message: "Quotation item deleted" };
    } catch (error) {
      throw new Error("Failed to delete quotation item");
    }
  });

export default quotationItemController;
