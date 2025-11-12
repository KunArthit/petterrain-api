import { Elysia, t } from "elysia";
import InvoiceService from "../classes/InvoiceClass";
import { InvoiceModel } from "../models/InvoiceModel";
import orderItemController from "./OrderItemController";
import OrderItemClass from "@/classes/OrderItemClass";

const invoiceController = new Elysia({
  prefix: "/invoices",
  tags: ["Invoices"],
})
  // Get all invoices
  .get("/", async () => {
    try {
      return await InvoiceService.getAllInvoices();
    } catch (error) {
      throw new Error("Failed to fetch invoices");
    }
  })

  // Get invoice by ID
  .get("/:id", async ({ params }) => {
    try {
      const invoice = await InvoiceService.getInvoiceById(Number(params.id));
      if (!invoice) throw new Error("Invoice not found");
      return invoice;
    } catch (error) {
      throw new Error("Failed to fetch invoice");
    }
  })

  // Get invoices by Order ID
  .get("/order/:order_id", async ({ params }) => {
    try {
      const orderId = Number(params.order_id);
      if (isNaN(orderId)) {
        throw new Error("Invalid order ID");
      }

      const orderItems = await OrderItemClass.getOrderItemsAndProductByOrderId(
        Number(params.order_id)
      );
      const resOrderInvoice = await InvoiceService.getInvoicesByOrderId(
        Number(params.order_id)
      );

      const resData = {
        ...resOrderInvoice[0],
        items: orderItems,
      };
      return resData;
    } catch (error) {
      throw new Error("Failed to fetch invoices for order");
    }
  })

  // Create invoice
  .post(
    "/",
    async ({ body }) => {
      try {
        const invoiceData = {
          ...body,
          invoice_date: new Date(body.invoice_date),
          due_date: new Date(body.due_date),
          tax_amount: body.tax_amount ?? null,
          shipping_cost: body.shipping_cost ?? null,
          notes: body.notes ?? null,
          address: body.address ?? null,
          sub_district: body.sub_district ?? null,
          district: body.district ?? null,
          province: body.province ?? null,
          zipcode: body.zipcode ?? null,
          phone_number: body.phone_number ?? null,
          customer_name: body.customer_name ?? null, // <-- เพิ่มฟิลด์ใหม่
          tracking: body.tracking ?? null, // <-- เพิ่มฟิลด์ใหม่
        };

        const invoiceId = await InvoiceService.createInvoice(
          invoiceData as Omit<InvoiceModel, "invoice_id" | "created_at">
        );

        return { message: "Invoice created", invoice_id: invoiceId };
      } catch (error) {
        console.error("Failed to create invoice:", error);
        throw new Error("Failed to create invoice");
      }
    },
    {
      body: t.Object({
        order_id: t.Number(),
        invoice_no: t.String(),
        invoice_date: t.String(),
        due_date: t.String(),
        subtotal: t.Number(),
        tax_amount: t.Optional(t.Number()),
        shipping_cost: t.Optional(t.Number()),
        total_amount: t.Number(),
        payment_status: t.String(),
        notes: t.Optional(t.String()),
        address: t.Optional(t.String()),
        sub_district: t.Optional(t.String()),
        district: t.Optional(t.String()),
        province: t.Optional(t.String()),
        zipcode: t.Optional(t.String()),
        phone_number: t.Optional(t.String()),
        customer_name: t.Optional(t.String()), // <-- เพิ่มฟิลด์ใหม่
        tracking: t.Optional(t.String()), // <-- เพิ่มฟิลด์ใหม่
      }),
    }
  )

  // Update invoice
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<InvoiceModel, "invoice_id" | "created_at">>;
    }) => {
      try {
        const success = await InvoiceService.updateInvoice(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Invoice update failed");
        return { message: "Invoice updated" };
      } catch (error) {
        throw new Error("Failed to update invoice");
      }
    }
  )

  // Delete invoice
  .delete("/:id", async ({ params }) => {
    try {
      const success = await InvoiceService.deleteInvoice(Number(params.id));
      if (!success) throw new Error("Invoice deletion failed");
      return { message: "Invoice deleted" };
    } catch (error) {
      throw new Error("Failed to delete invoice");
    }
  });

export default invoiceController;
