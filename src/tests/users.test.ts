import supertest, { Agent } from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import bcrypt from "bcrypt";
import userModel from "../models/userModel";

var app: Express;
var request: Agent;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany();

  await supertest(app).post("/auth/register").send(user);
  const res = await supertest(app).post("/auth/login").send(user);
  userId = res.body._id;
  const token = res.body.accessToken;
  expect(token).toBeDefined();

  request = supertest.agent(app).set({ authorization: `JWT ${token}` });
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
  password: "secret",
};
describe("Users Tests", () => {
  test("Test get user by username", async () => {
    const response = await request.get(`/users?username=${user.username}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe(user.username);
    expect(response.body[0].email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body[0].password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test get user by email", async () => {
    const response = await request.get(`/users?email=${user.email}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe(user.username);
    expect(response.body[0].email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body[0].password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test get user by id", async () => {
    const response = await request.get(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body.password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test Update User's Username", async () => {
    const response = await request.put(`/users/${userId}`).send({
      username: "Superman",
    });
    user.username = "Superman";
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body.password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test Update User's Email", async () => {
    const response = await request.put(`/users/${userId}`).send({
      email: "Superman@gmail.com",
    });
    user.email = "Superman@gmail.com";
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body.password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test get all users", async () => {
    const response = await request.get(`/users`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].username).toBe(user.username);
    expect(response.body[0].email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body[0].password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test Update User with duplicate email", async () => {
    await supertest(app).post("/auth/register").send({
      username: "Hadar",
      email: "H@gmail.com",
      password: "secret",
    });

    const response = await request.put(`/users/${userId}`).send({
      email: "H@gmail.com",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Duplicate Key");
  });

  test("Test Create User with duplicate username", async () => {
    const response = await request.put(`/users/${userId}`).send({
      username: "Hadar",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Duplicate Key");
  });

  test("Test Delete User", async () => {
    const response = await request.delete(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body.password,
    );
    expect(validPassword).toBe(true);
  });

  test("Test get user by id that doesn't exist", async () => {
    const response = await request.get(`/users/${userId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Update user with not existing id", async () => {
    const response = await request.put(`/users/${userId}`).send({
      username: "Hadar",
    });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });
});
