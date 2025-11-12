import { Elysia, t } from "elysia";
import ServiceTicketService from "../classes/ServiceTicketClass";
import { ServiceTicketModel } from "@/models/ServiceTicketModel";

const serviceTicketController = new Elysia({
  prefix: "/service-tickets",
  tags: ["Service tickets"],
})
  // Get all service tickets
  .get("/", async () => {
    try {
      return await ServiceTicketService.getAllTickets();
    } catch (error) {
      throw new Error("Failed to fetch service tickets");
    }
  })

  // Get service ticket by ID
  .get("/:id", async ({ params }) => {
    try {
      const ticket = await ServiceTicketService.getTicketById(
        Number(params.id)
      );
      if (!ticket) throw new Error("Service ticket not found");
      return ticket;
    } catch (error) {
      throw new Error("Failed to fetch service ticket");
    }
  })

  // Get tickets by User ID
  .get("/user/:user_id", async ({ params }) => {
    try {
      return await ServiceTicketService.getTicketsByUserId(
        Number(params.user_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch tickets for user");
    }
  })

  // Create service ticket
  .post(
    "/",
    async ({ body }) => {
      try {
        const ticketId = await ServiceTicketService.createTicket({
          ...body,
          user_id: body.user_id ?? null,
          assigned_to: body.assigned_to ?? null,
          resolved_at: body.resolved_at ? new Date(body.resolved_at) : null,
        });
        return { message: "Service ticket created", ticket_id: ticketId };
      } catch (error) {
        throw new Error("Failed to create service ticket");
      }
    },
    {
      body: t.Object({
        user_id: t.Optional(t.Number()),
        subject: t.String(),
        description: t.String(),
        status: t.String(),
        priority: t.String(),
        assigned_to: t.Optional(t.Number()),
        resolved_at: t.Optional(t.String()), // YYYY-MM-DD format
      }),
    }
  )

  // Update service ticket
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<ServiceTicketModel, "ticket_id" | "created_at">>;
    }) => {
      try {
        const success = await ServiceTicketService.updateTicket(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Service ticket update failed");
        return { message: "Service ticket updated" };
      } catch (error) {
        throw new Error("Failed to update service ticket");
      }
    }
  )

  // Delete service ticket
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ServiceTicketService.deleteTicket(
        Number(params.id)
      );
      if (!success) throw new Error("Service ticket deletion failed");
      return { message: "Service ticket deleted" };
    } catch (error) {
      throw new Error("Failed to delete service ticket");
    }
  });

export default serviceTicketController;
