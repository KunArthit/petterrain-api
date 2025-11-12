import { Elysia, t } from "elysia";
import ChatMessageService from "../classes/ChatMessageClass";
import { ChatMessageModel } from "../models/ChatMessageModel";

const chatMessageController = new Elysia({
  prefix: "/chat-message",
  tags: ["Chat Message"],
})
  // Get all chat messages
  .get("/", async () => {
    try {
      return await ChatMessageService.getAllMessages();
    } catch (error) {
      throw new Error("Failed to fetch chat messages");
    }
  })

  // Get chat message by ID
  .get("/:id", async ({ params }) => {
    try {
      const message = await ChatMessageService.getMessageById(
        Number(params.id)
      );
      if (!message) throw new Error("Chat message not found");
      return message;
    } catch (error) {
      throw new Error("Failed to fetch chat message");
    }
  })

  // Get chat messages by session ID
  .get("/session/:session_id", async ({ params }) => {
    try {
      return await ChatMessageService.getMessagesBySessionId(
        Number(params.session_id)
      );
    } catch (error) {
      throw new Error("Failed to fetch chat messages for session");
    }
  })

  // Create chat message
  .post(
    "/",
    async ({ body }) => {
      try {
        const messageId = await ChatMessageService.createMessage(body);
        return { message: "Chat message created", message_id: messageId };
      } catch (error) {
        throw new Error("Failed to create chat message");
      }
    },
    {
      body: t.Object({
        session_id: t.Number(),
        sender_type: t.String(),
        sender_id: t.Number(),
        message_text: t.String(),
        is_read: t.Boolean(),
      }),
    }
  )

  // Update chat message (edit or mark as read)
  .put(
    "/:id",
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: Partial<Omit<ChatMessageModel, "message_id" | "created_at">>;
    }) => {
      try {
        const success = await ChatMessageService.updateMessage(
          Number(params.id),
          body
        );
        if (!success) throw new Error("Chat message update failed");
        return { message: "Chat message updated" };
      } catch (error) {
        throw new Error("Failed to update chat message");
      }
    }
  )

  // Delete chat message
  .delete("/:id", async ({ params }) => {
    try {
      const success = await ChatMessageService.deleteMessage(Number(params.id));
      if (!success) throw new Error("Chat message deletion failed");
      return { message: "Chat message deleted" };
    } catch (error) {
      throw new Error("Failed to delete chat message");
    }
  });

export default chatMessageController;
