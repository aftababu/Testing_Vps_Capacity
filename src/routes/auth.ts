import { Hono } from "hono";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";

const auth = new Hono();

auth.post("/register", async (c) => {
  const { name, email, password } = await c.req.json();

  if (!name || !email || !password) {
    return c.json({ error: "Name, email and password are required" }, 400);
  }

  if (password.length < 8) {
    return c.json(
      { error: "Password must be at least 8 characters" },
      400,
    );
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

  return c.json(user, 201);
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const validPassword = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!validPassword) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await sign(
    {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
    process.env.JWT_SECRET!,
  );

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

export default auth;
