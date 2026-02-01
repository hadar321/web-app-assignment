import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err);
});

dotenv.config();
const port = process.env.PORT ?? "3000";

mongoose
  .connect(process.env.DB_CONNECT ?? "")
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("DB Error:" + err));

const app = express();
const { json, urlencoded } = bodyParser;
app.use(json());
app.use(urlencoded({ extended: true }));

import postsRoute from "./routes/postRoutes";
import commentsRoute from "./routes/commentRoutes";
import usersRoute from "./routes/userRoutes";
app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/users", usersRoute);

app.listen(Number(port), () => {
  console.log(`App listening at http://localhost:${port}`);
});
