import express from "express";
const app = express();

import dotenv from "dotenv"
dotenv.config()
const port = process.env.PORT;

import { mongoose } from "mongoose";
mongoose.connect(process.env.DB_CONNECT);
const db = mongoose.connection;
db.on("error", (error) => console.error("DB Error:" + error));
db.once("open", () => console.log("Connected to database"));

import bodyParserPkg  from "body-parser";
const { json, urlencoded } = bodyParserPkg;
app.use(json());
app.use(urlencoded({ extended: true }));

import postsRoute from "./routes/postRoutes.js";
app.use("/post", postsRoute);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});