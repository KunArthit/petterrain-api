process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { apiRouter } from "./api";
import { cors } from "@elysiajs/cors";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import type { ServerWebSocket } from "bun";

const prisma = new PrismaClient();
const clients: Map<string, Set<ServerWebSocket<any>>> = new Map();

// Directory for images
const UPLOADS_DIR = "/app/images";

// Ensure uploads directory exists
// if (!existsSync(UPLOADS_DIR)) {
//   mkdirSync(UPLOADS_DIR, { recursive: true });
// }

export const app = new Elysia()
  // Log all incoming requests
  .onRequest(({ request }) => {
    console.log(`Incoming Request: ${request.method} ${new URL(request.url).pathname}`);
  })

  .use(cors())

  // Root & health
  .get("/", () => ({ message: "Welcome to Elysia API" }))
  .get("/health", () => ({ status: "ok" }))

  // Serve images
  .get('/images/:filename', async ({ params, set }) => {
    const filepath = join(UPLOADS_DIR, params.filename);

    if (!existsSync(filepath)) {
      set.status = 404;
      return "File not found";
    }

    // Determine content type
    const ext = params.filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'gif') contentType = 'image/gif';

    set.headers['Content-Type'] = contentType;
    set.headers['Cache-Control'] = 'public, max-age=31536000, immutable';

    return Bun.file(filepath);
  })

  // API routes
  .use(apiRouter({ prefix: "/api" }))

  // Swagger documentation
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Elysia API Documentation",
          version: "1.0.0",
        },
        tags: [
          { name: "Users", description: "User Management Endpoints" },
          { name: "Products", description: "Product Management Endpoints" },
        ],
      },
    })
  );