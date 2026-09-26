import type { Context, Next } from "hono";
import { verify } from "hono/jwt";

export const auth = async (c: Context, next: Next) => {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authorization.slice(7);

  try {
    const payload = await verify(token, process.env.JWT_SECRET,"HS256");

    c.set("user", {
      id: payload.sub as string,
    });

    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
