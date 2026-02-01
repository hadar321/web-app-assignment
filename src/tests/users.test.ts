import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import bcrypt from 'bcrypt';
import userModel from "../models/userModel";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany();
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let userId = "";
const user = {
  username: "Hadadr Hadar",
  email: "HadarHadar@gmail.com",
  password: "secret"
}
describe("Users Tests", () => {
  test("Users test get all", async () => {
    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create User", async () => {
    const response = await request(app).post("/users").send(user);
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body.password);
    expect(validPassword).toBe(true);
    userId = response.body._id;
  });

  test("Test Create user without username", async () => {
    const { username, ...rest } = user;
    const response = await request(app).post("/users").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: username: Path `username` is required."
    );
  });

  test("Test Create user without email", async () => {
    const { email, ...rest } = user;
    const response = await request(app).post("/users").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: email: Path `email` is required."
    );
  });

  test("Test Create user without password", async () => {
    const { password, ...rest } = user;
    const response = await request(app).post("/users").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: password: Path `password` is required."
    );
  });

  test("Test Create user with username of empty string", async () => {
    const response = await request(app).post("/users").send({...user, username: ""});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: username: Path `username` is required."
    );
  });

  test("Test Create user with email of empty string", async () => {
    const response = await request(app).post("/users").send({...user, email: ""});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: email: Path `email` is required."
    );
  });

  test("Test Create user with password of empty string", async () => {
    const response = await request(app).post("/users").send({...user, password: ""});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: password: Path `password` is required."
    );
  });

  test("Test get user by username", async () => {
    const response = await request(app).get(`/users?username=${user.username}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe(user.username);
    expect(response.body[0].email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body[0].password);
    expect(validPassword).toBe(true);
  });

  test("Test get user by email", async () => {
    const response = await request(app).get(`/users?email=${user.email}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe(user.username);
    expect(response.body[0].email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body[0].password);
    expect(validPassword).toBe(true);
  });

  test("Test get user by id", async () => {
    const response = await request(app).get(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body.password);
    expect(validPassword).toBe(true);
  });

  test("Test Update User's Username", async () => {
    const response = await request(app).put(`/users/${userId}`).send({
      username: "Superman",
    });
    user.username = "Superman"
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body.password);
    expect(validPassword).toBe(true);
  });

  test("Test Update User's Email", async () => {
    const response = await request(app).put(`/users/${userId}`).send({
      email: "Superman@gmail.com",
    });
    user.email = "Superman@gmail.com"
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body.password);
    expect(validPassword).toBe(true);
  });

  test("Test get all users", async () => {
    const response = await request(app).get(`/users`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe(user.username);
    expect(response.body[0].email).toBe(user.email);
    const validPassword = await bcrypt.compare(user.password, response.body[0].password);
    expect(validPassword).toBe(true);
  });

  test("Test Delete User", async () => {
    const response = await request(app).delete(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
  });

  test("Test get user by id that doesn't exist", async () => {
    const response = await request(app).get(`/users/${userId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Update user with not existing id", async () => {
    const response = await request(app).put(`/users/${userId}`).send({
      username: "Batman",
    });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });
});