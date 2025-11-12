import { security } from "@/security";

import { bearer } from "@elysiajs/bearer";
import { Elysia } from "elysia";
import jwt from "jsonwebtoken";

import { HTTPError } from "./errors";

export const auth = new Elysia()
  .use(bearer())
  .use(security)
  .derive(
    { as: "scoped" },
    async ({ request, bearer, cookie: { access_token } }) => {
      // validate token

      const token = bearer || access_token?.value;

      if (!token) {
        throw new HTTPError(403, "Could not validate credentials");
      }

      const jwtPayload = jwt.verify(token, "your-secret-key");
      if (!jwtPayload) {
        // bypass swagger
        const url = new URL(request.url);
        if (
          ["/swagger", "/swagger/json"].some((path) => url.pathname === path)
        ) {
          return;
        }

        throw new HTTPError(403, "Could not validate credentials");
      }
    }
  );
