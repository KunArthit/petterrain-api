import { Elysia, t } from "elysia";
import TicketResponseService from "../classes/TicketResponseClass";
import { TicketResponseModel } from "@/models/TicketResponseModel";

const ticketResponseController = new Elysia({
  prefix: "/ticket-response",
  tags: ["Ticket Responses"],
})
  // Get all ticket responses
  .get("/", async () => {
    try {
      return await TicketResponseService.getAllResponses();
    } catch (error) {
      throw new Error("Failed to fetch ticket responses");
    }
  })

  // Get ticket response by ID
  .get("/:id", async ({ params }) => {
    try {
      const response = await TicketResponseService.getResponseById(
        Number(params.id)
      );
      if (!response) throw new Error("Ticket response not found");
      return response;
    } catch (error) {
      throw new Error("Failed to fetch ticket response");
    }
  })

  // Get responses by Ticket ID
  .get("/ticket/:ticket_id", async ({ params }) => {
    try {
      return await TicketResponseService.getResponsesByTicketId(
        Number(params.ticket_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch ticket responses for ticket");
    }
  })

  // Create ticket response
  .post(
    "/",
    async ({ body }) => {
      try {
        const responseId = await TicketResponseService.createResponse({
          ...body,
          user_id: body.user_id ?? null,
        });
        return { message: "Ticket response created", response_id: responseId };
      } catch (error) {
        throw new Error("Failed to create ticket response");
      }
    },
    {
      body: t.Object({
        ticket_id: t.Number(),
        user_id: t.Optional(t.Number()),
        response_text: t.String(),
      }),
    }
  )

  // Update ticket response
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<TicketResponseModel, "response_id" | "created_at">>;
    }) => {
      try {
        const success = await TicketResponseService.updateResponse(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Ticket response update failed");
        return { message: "Ticket response updated" };
      } catch (error) {
        throw new Error("Failed to update ticket response");
      }
    }
  )

  // Delete ticket response
  .delete("/:id", async ({ params }) => {
    try {
      const success = await TicketResponseService.deleteResponse(
        Number(params.id)
      );
      if (!success) throw new Error("Ticket response deletion failed");
      return { message: "Ticket response deleted" };
    } catch (error) {
      throw new Error("Failed to delete ticket response");
    }
  });

export default ticketResponseController;
