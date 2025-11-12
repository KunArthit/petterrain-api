import { Elysia, t } from "elysia";
import PaymentTransactionService from "../classes/PaymentTransactionClass";
import { PaymentTransactionModel } from "../models/PaymentTransactionModel";

const paymentTransactionController = new Elysia({
  prefix: "/payment-transaction",
  tags: ["Payment Transaction"],
})
  // Get all payment transactions
  .get("/", async () => {
    try {
      return await PaymentTransactionService.getAllTransactions();
    } catch (error) {
      throw new Error("Failed to fetch payment transactions");
    }
  })

  // Get payment transaction by ID
  .get("/:id", async ({ params }) => {
    try {
      const transaction = await PaymentTransactionService.getTransactionById(
        Number(params.id)
      );
      if (!transaction) throw new Error("Payment transaction not found");
      return transaction;
    } catch (error) {
      throw new Error("Failed to fetch payment transaction");
    }
  })

  // Get payment transactions by Order ID
  .get("/order/:order_id", async ({ params }) => {
    try {
      return await PaymentTransactionService.getTransactionsByOrderId(
        Number(params.order_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch payment transactions for order");
    }
  })

  // Create payment transaction
  .post(
    "/",
    async ({ body }) => {
      try {
        const transactionId = await PaymentTransactionService.createTransaction(
          {
            ...body,
            transaction_reference: body.transaction_reference ?? null,
            payment_date: body.payment_date
              ? new Date(body.payment_date)
              : null,
            notes: body.notes ?? null,
          }
        );
        return {
          message: "Payment transaction created",
          transaction_id: transactionId,
        };
      } catch (error) {
        throw new Error("Failed to create payment transaction");
      }
    },
    {
      body: t.Object({
        order_id: t.Number(),
        amount: t.Number(),
        payment_method: t.String(),
        transaction_status: t.String(),
        transaction_reference: t.Optional(t.Union([t.String(), t.Null()])),
        payment_date: t.Optional(t.Union([t.String(), t.Null()])),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )

  // Update payment transaction
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<
        Omit<PaymentTransactionModel, "transaction_id" | "created_at">
      >;
    }) => {
      try {
        const success = await PaymentTransactionService.updateTransaction(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Payment transaction update failed");
        return { message: "Payment transaction updated" };
      } catch (error) {
        throw new Error("Failed to update payment transaction");
      }
    }
  )

  // Delete payment transaction
  .delete("/:id", async ({ params }) => {
    try {
      const success = await PaymentTransactionService.deleteTransaction(
        Number(params.id)
      );
      if (!success) throw new Error("Payment transaction deletion failed");
      return { message: "Payment transaction deleted" };
    } catch (error) {
      throw new Error("Failed to delete payment transaction");
    }
  });

export default paymentTransactionController;
