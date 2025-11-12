import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const chatController = new Elysia({
  prefix: "/wchat",
  tags: ["WebSocket Chat"],
})
  .post(
    "/session",
    async ({ body }) => {
      const { user_id, session_type } = body;
      const newSession = await prisma.chat_sessions.create({
        data: {
          user_id,
          session_type,
          status: "active",
          created_at: new Date(),
        },
      });
      return newSession;
    },
    {
      body: t.Object({
        user_id: t.Number(),
        session_type: t.Union([t.Literal("customer"), t.Literal("internal")]),
        receiver_user_id: t.Optional(t.Number()),
      }),
    }
  )

  .get("/:session_id", async ({ params, query }) => {
    const sessionId = Number(params.session_id);
    const userId = query.user_id ? Number(query.user_id) : null;
    const skip = Number(query.skip || 0);
    const take = Number(query.take || 100);
    const unreadOnly = query.unread_only === "true";

    const whereClause: any = { session_id: sessionId };
    if (unreadOnly) whereClause.is_read = false;

    if (userId !== null) {
      whereClause.OR = [{ sender_id: userId }, { receiver_user_id: userId }];
    }

    const messages = await prisma.chat_messages.findMany({
      where: whereClause,
      orderBy: { created_at: "asc" },
      skip,
      take,
    });

    return messages;
  })

  .post(
    "/send",
    async ({ body }) => {
      const {
        session_id,
        sender_type,
        sender_id,
        message_text,
        receiver_user_id,
      } = body;

      const message = await prisma.chat_messages.create({
        data: {
          session_id,
          sender_type,
          receiver_user_id,
          sender_id,
          message_text,
          is_read: false,
          created_at: new Date(),
        },
      });

      return message;
    },
    {
      body: t.Object({
        session_id: t.Number(),
        sender_type: t.Union([
          t.Literal("user"),
          t.Literal("admin"),
          t.Literal("bot"),
        ]),
        sender_id: t.Number(),
        receiver_user_id: t.Optional(t.Number()),
        message_text: t.String(),
      }),
    }
  )

  .patch("/:message_id/read", async ({ params }) => {
    const messageId = Number(params.message_id);
    return await prisma.chat_messages.update({
      where: { message_id: messageId },
      data: { is_read: true },
    });
  })

  .get("/sessions/:user_id", async ({ params }) => {
    const userId = Number(params.user_id);
    const sessions = await prisma.chat_sessions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        chat_messages: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    return sessions.map((s) => ({
      session_id: s.session_id,
      session_type: s.session_type,
      status: s.status,
      created_at: s.created_at,
      last_message: s.chat_messages[0]?.message_text || null,
      last_time: s.chat_messages[0]?.created_at || null,
    }));
  })

  .get("/sessions/between/:user1/:user2", async ({ params }) => {
    const user1 = Number(params.user1);
    const user2 = Number(params.user2);

    const sessions = await prisma.chat_sessions.findMany({
      include: {
        chat_messages: {
          where: {
            OR: [
              { sender_id: user1, receiver_user_id: user2 },
              { sender_id: user2, receiver_user_id: user1 },
            ],
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
    });

    return sessions.map((s) => ({
      session_id: s.session_id,
      session_type: s.session_type,
      status: s.status,
      created_at: s.created_at,
      last_message: s.chat_messages[0]?.message_text || null,
      last_time: s.chat_messages[0]?.created_at || null,
    }));
  })

  .get("/conversations/:user_id", async ({ params }) => {
    const userId = Number(params.user_id);

    const messages = await prisma.chat_messages.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_user_id: userId }],
      },
      orderBy: { created_at: "desc" },
    });

    const map = new Map();

    messages.forEach((m) => {
      const partnerId =
        m.sender_id === userId ? m.receiver_user_id : m.sender_id;
      if (partnerId && !map.has(partnerId)) {
        map.set(partnerId, {
          user_id: partnerId,
          session_id: m.session_id,
          last_message: m.message_text,
          last_time: m.created_at,
        });
      }
    });

    return Array.from(map.values());
  })
  .get("/history/:user1/:user2", async ({ params }) => {
    const user1 = Number(params.user1);
    const user2 = Number(params.user2);

    const messages = await prisma.chat_messages.findMany({
      where: {
        OR: [
          { sender_id: user1, receiver_user_id: user2 },
          { sender_id: user2, receiver_user_id: user1 },
        ],
      },
      orderBy: { created_at: "asc" },
    });

    return messages;
  });
