import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import https from "https";
import http from "http";
import fs from "fs";

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err);
});

dotenv.config();
const port = process.env.PORT ?? "3000";

function buildMongoUriFromEnv(): string {
  const raw = process.env.DB_CONNECT ?? "";
  const userEnv = process.env.DB_USER;
  const passEnv = process.env.DB_PASS;

  // If DB_USER/DB_PASS provided, inject them into the URI, encoding safely.
  if (userEnv) {
    // If raw already contains userinfo (user@), strip it first
    const m = raw.match(/^(mongodb(?:\+srv)?:\/\/)([^@]+@)?(.+)$/);
    if (!m) return raw;
    const protocol = m[1];
    const rest = m[3];
    const user = encodeURIComponent(userEnv);
    const pass = passEnv ? encodeURIComponent(passEnv) : undefined;
    const auth = pass ? `${user}:${pass}@` : `${user}@`;
    return protocol + auth + rest;
  }

  // Otherwise, if raw contains userinfo but not encoded, attempt to encode it
  const m2 = raw.match(/^(mongodb(?:\+srv)?:\/\/)([^@]+)@(.+)$/);
  if (m2) {
    const protocol = m2[1];
    const userinfo = m2[2];
    const rest = m2[3];
    // split userinfo into user[:pass]
    const idx = userinfo.indexOf(":");
    if (idx === -1) return raw;
    const user = encodeURIComponent(userinfo.slice(0, idx));
    const pass = encodeURIComponent(userinfo.slice(idx + 1));
    return protocol + user + ":" + pass + "@" + rest;
  }

  return raw;
}

const dbUri = buildMongoUriFromEnv();
const masked = dbUri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, (m, p1, u) => `${p1}${u}:***@`);
console.log("Using DB_CONNECT:", masked || "(empty)");

mongoose
  .connect(dbUri)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("DB Error:" + err));

const app = express();
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./src/routes/*.ts"],  // Updated path for relative scanning
};

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
const { json, urlencoded } = bodyParser;
app.use(json());
app.use(urlencoded({ extended: true }));
// CORS: allow frontend origin(s)
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:8080";
// During development accept common local dev origins (Vite/dev server)
const devAllowed = [frontendOrigin, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
if (process.env.NODE_ENV === "production") {
  app.use(cors({ origin: frontendOrigin, credentials: true }));
  app.options('*', cors({ origin: frontendOrigin, credentials: true }));
} else {
  // reflect origin for local development to make tooling and proxies work
  app.use(cors({ origin: (origin, cb) => cb(null, origin ? devAllowed.includes(origin) : false), credentials: true }));
  app.options('*', cors({ origin: (origin, cb) => cb(null, origin ? devAllowed.includes(origin) : false), credentials: true }));
}

// Simple request logger to help diagnose routing/CORS issues
app.use((req, res, next) => {
  try {
    console.log('<< REQ', req.method, req.originalUrl, 'Origin:', req.headers.origin || '-', 'Referer:', req.headers.referer || '-');
  } catch (e) {}
  next();
});

import postsRoute from "./routes/postRoutes";
import commentsRoute from "./routes/commentRoutes";
import usersRoute from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/users", usersRoute);
app.use("/auth", authRoutes);

if (process.env.NODE_ENV !== 'production') {
  console.log('development');
  http.createServer(app).listen(Number(port), () => {
    console.log(`App listening at http://localhost:${port}`);
  });
} else {
  console.log('PRODUCTION');
  const options = {
    key: fs.readFileSync('./client-key.pem'),
    cert: fs.readFileSync('./client-cert.pem')
  };
  const httpsPort = process.env.HTTPS_PORT || port;
  https.createServer(options, app).listen(Number(httpsPort), () => {
    console.log(`App listening at https://localhost:${httpsPort}`);
  });
}
