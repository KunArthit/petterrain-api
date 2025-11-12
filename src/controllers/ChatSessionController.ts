import { Elysia, t } from "elysia";
import ChatSessionService from "../classes/ChatSessionClass";
import { ChatSessionModel } from "@/models/ChatSessionModel";

const chatSessionController = new Elysia({
  prefix: "/chat-session",
  tags: ["Chat Session"],
})
  // Get all chat sessions
  .get("/", async () => {
    try {
      return await ChatSessionService.getAllSessions();
    } catch (error) {
      throw new Error("Failed to fetch chat sessions");
    }
  })

  // Get chat session by ID
  .get("/:id", async ({ params }) => {
    try {
      const session = await ChatSessionService.getSessionById(
        Number(params.id)
      );
      if (!session) throw new Error("Chat session not found");
      return session;
    } catch (error) {
      throw new Error("Failed to fetch chat session");
    }
  })

  // Get chat sessions by user ID
  .get("/user/:user_id", async ({ params }) => {
    try {
      return await ChatSessionService.getSessionsByUserId(
        Number(params.user_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch chat sessions for user");
    }
  })

  // Create chat session
  .post(
    "/",
    async ({ body }) => {
      try {
        const sessionId = await ChatSessionService.createSession(body);
        return { message: "Chat session created", session_id: sessionId };
      } catch (error) {
        throw new Error("Failed to create chat session");
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        session_type: t.String(),
        status: t.String(),
      }),
    }
  )

  // Update chat session (change status or close session)
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<ChatSessionModel, "session_id" | "created_at">>;
    }) => {
      try {
        const success = await ChatSessionService.updateSession(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Chat session update failed");
        return { message: "Chat session updated" };
      } catch (error) {
        throw new Error("Failed to update chat session");
      }
    }
  )

  // Close chat session
  .patch("/:id/close", async ({ params }) => {
    try {
      const success = await ChatSessionService.closeSession(Number(params.id));
      if (!success) throw new Error("Chat session closure failed");
      return { message: "Chat session closed" };
    } catch (error) {
      throw new Error("Failed to close chat session");
    }
  })

  // Delete chat session
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ChatSessionService.deleteSession(Number(params.id));
      if (!success) throw new Error("Chat session deletion failed");
      return { message: "Chat session deleted" };
    } catch (error) {
      throw new Error("Failed to delete chat session");
    }
  });

export default chatSessionController;
