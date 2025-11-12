import Elysia, { t, Context } from "elysia";
import BankTransferService from "../classes/BankClass";

const bankTransferController = new Elysia({
  prefix: "/bank-transfers",
  tags: ["BankTransfers"],
})
  // 🔍 Get all
  .get("/", async () => {
    return await BankTransferService.getAllBankTransfers();
  })

  // 🔍 Get by ID
  .get("/:id", async ({ params }) => {
    const transfer = await BankTransferService.getBankTransferById(Number(params.id));
    if (!transfer) throw new Error("Bank transfer not found");
    return transfer;
  })

  // ➕ Create
  .post(
    "/",
    async ({ body }: { body: { order_id: number; user_id: number; reference: string; slip_filename: string; slip_path: string; uploaded_at?: string | null; verified_at?: string | null; verified_by?: number | null; status: string; note: string; } }, ctx: Context) => {
      try {
        const transferData = {
          ...body,
          uploaded_at: body.uploaded_at ? new Date(body.uploaded_at) : null,
          verified_at: body.verified_at ? new Date(body.verified_at) : null,
          verified_by: body.verified_by ?? null
        };
        const transferId = await BankTransferService.createBankTransfer(transferData);
        return { message: "Bank transfer created", transfer_id: transferId };
      } catch (error) {
        ctx.set.status = 500;
        return {
          error: "Create failed",
          message: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        order_id: t.Number(),
        user_id: t.Number(),
        reference: t.String(),
        slip_filename: t.String(),
        slip_path: t.String(),
        uploaded_at: t.Optional(t.Nullable(t.String())), // ISO string
        verified_at: t.Optional(t.Nullable(t.String())),
        verified_by: t.Optional(t.Nullable(t.Number())),
        status: t.String(),
        note: t.String(),
      }),
    }
  )

  // ✏️ Update
  .put(
    "/:id",
    async ({ params, body }: { params: { id: string }; body: { order_id?: number; user_id?: number; reference?: string; slip_filename?: string; slip_path?: string; uploaded_at?: string | null; verified_at?: string | null; verified_by?: number | null; status?: string; note?: string; } }, ctx: Context) => {
      try {
        const updateData = {
          ...body,
          uploaded_at: body.uploaded_at !== undefined ? (body.uploaded_at ? new Date(body.uploaded_at) : null) : undefined,
          verified_at: body.verified_at !== undefined ? (body.verified_at ? new Date(body.verified_at) : null) : undefined
        };
        const success = await BankTransferService.updateBankTransfer(Number(params.id), updateData);
        if (!success) throw new Error("Update failed");
        return { message: "Bank transfer updated" };
      } catch (error) {
        ctx.set.status = 500;
        return {
          error: "Update failed",
          message: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        order_id: t.Optional(t.Number()),
        user_id: t.Optional(t.Number()),
        reference: t.Optional(t.String()),
        slip_filename: t.Optional(t.String()),
        slip_path: t.Optional(t.String()),
        uploaded_at: t.Optional(t.Nullable(t.String())),
        verified_at: t.Optional(t.Nullable(t.String())),
        verified_by: t.Optional(t.Nullable(t.Number())),
        status: t.Optional(t.String()),
        note: t.Optional(t.String()),
      }),
    }
  )

  // 🗑 Delete
  .delete("/:id", async ({ params }: { params: { id: string } }, ctx: Context) => {
    try {
      const success = await BankTransferService.deleteBankTransfer(Number(params.id));
      if (!success) throw new Error("Delete failed");
      return { message: "Bank transfer deleted" };
    } catch (error) {
      ctx.set.status = 500;
      return {
        error: "Delete failed",
        message: (error as Error).message,
      };
    }
  });

export default bankTransferController;
