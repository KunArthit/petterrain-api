import { Elysia, t } from "elysia";
import ChatbotResponseService from "../classes/ChatbotResponseClass";

const chatbotResponseController = new Elysia({
  prefix: "/chatbot-response",
  tags: ["Chatbot Response"],
})
  // Get all chatbot responses
  .get("/", async () => {
    try {
      return await ChatbotResponseService.getAllResponses();
    } catch (error) {
      throw new Error("Failed to fetch chatbot responses");
    }
  })

  // Get chatbot response by ID
  .get("/:id", async ({ params }) => {
    try {
      const response = await ChatbotResponseService.getResponseById(
        Number(params.id)
      );
      if (!response) throw new Error("Chatbot response not found");
      return response;
    } catch (error) {
      throw new Error("Failed to fetch chatbot response");
    }
  })

  // Get chatbot response by keyword
  .get("/keyword/:keyword", async ({ params }) => {
    try {
      const response = await ChatbotResponseService.getResponseByKeyword(
        params.keyword
      );
      if (!response)
        throw new Error("No chatbot response found for the keyword");
      return response;
    } catch (error) {
      throw new Error("Failed to fetch chatbot response by keyword");
    }
  })

  // Create chatbot response
  .post(
    "/",
    async ({ body }) => {
      try {
        const responseId = await ChatbotResponseService.createResponse(body);
        return { message: "Chatbot response created", response_id: responseId };
      } catch (error) {
        throw new Error("Failed to create chatbot response");
      }
    },
    {
      body: t.Object({
        keyword: t.String(),
        response_text: t.String(),
        is_active: t.Boolean(),
      }),
    }
  )

  // Update chatbot response
  .put(
    "/:id",
    async ({ params, body }) => {
      try {
        const success = await ChatbotResponseService.updateResponse(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Chatbot response update failed");
        return { message: "Chatbot response updated" };
      } catch (error) {
        throw new Error("Failed to update chatbot response");
      }
    },
    {
      body: t.Partial(
        t.Object({
          keyword: t.String(),
          response_text: t.String(),
          is_active: t.Boolean(),
        })
      ),
    }
  )

  // Delete chatbot response
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ChatbotResponseService.deleteResponse(
        Number(params.id)
      );
      if (!success) throw new Error("Chatbot response deletion failed");
      return { message: "Chatbot response deleted" };
    } catch (error) {
      throw new Error("Failed to delete chatbot response");
    }
  });

export default chatbotResponseController;
