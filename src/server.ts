import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Express } from "express";
import mongoose from "mongoose";
import commentsRoute from "./routes/commentRoutes";
import postsRoute from "./routes/postRoutes";
import usersRoute from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

if (process.env.NODE_ENV == "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}

const app = express();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:3000", },],
  },
  apis: ["./src/routes/*.ts"],
};

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/users", usersRoute);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const appStart = () => {
  return new Promise<Express>((resolve, reject) => {
    if (!process.env.DB_CONNECT) {
      reject("DB_CONNECT is not defined in .env file");
    } else {
      mongoose
        .connect(process.env.DB_CONNECT)
        .then(() => {
          resolve(app);
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
};
export default appStart;