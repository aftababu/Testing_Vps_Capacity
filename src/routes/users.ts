import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";
import { auth } from "../middlewares/auth";

const usersRoute = new Hono();

usersRoute.use("*", auth);

usersRoute.get("/me", async (c) => {
  const user = c.get("user");

  const result = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(result);
});

usersRoute.patch("/me", async (c) => {
  const user = c.get("user");
  const { name } = await c.req.json();

  if (!name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

  return c.json(updatedUser);
});

export default usersRoute;
