import type { Context, Next } from "hono";

type Role = "admin" | "collection_controller" | "user";

export const rbac = (...allowedRoles: Role[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const role = user.role as Role;

    if (!allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
};
