
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import "dotenv/config";
import { Hono } from "hono";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import organizationRoutes from "./routes/organizations";
import collectionRoutes from "./routes/collections";
import playlistRoutes from "./routes/playlists";
import videoRoutes from "./routes/videos";

const app = new Hono();
//type
import type { Context } from "hono";


app.use("*", cors());
app.use("*", csrf());
app.use(
  "*",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    keyGenerator: (c: Context) =>
      c.req.header("X-forwarded-for") || "anonymous",
  }),
);
app.use("*", secureHeaders());

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    name: "Distraction-Free YouTube",
    status: "ok",
  });
});

app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/organizations", organizationRoutes);
app.route("/collections", collectionRoutes);
app.route("/playlists", playlistRoutes);
app.route("/videos", videoRoutes);

export default app;
