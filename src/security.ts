import { jwt } from "@elysiajs/jwt";
import { t } from "elysia";

import { env } from "./core/config";

const ALGORITHM = "HS256";

export const security = jwt({
  name: "jwt",
  secret: env.SECRET_KEY,
  alg: ALGORITHM,
  exp: env.ACCESS_TOKEN_EXPIRE,
  schema: t.Object({
    sub: t.String(),
  }),
});
