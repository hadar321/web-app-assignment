import requestFunc, { Agent } from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import bcrypt from "bcrypt";
import userModel, { IUser } from "../models/userModel";

var app: Express;
var request: Agent;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await userModel.deleteMany();

  request = requestFunc(app);
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

type User = IUser & {
  accessToken?: string;
  refreshToken?: string;
};

const user: User = {
  username: "Tal",
  email: "test@user.com",
  password: "testpassword",
};

describe("Auth Tests", () => {
  test("Test Create User", async () => {
    const response = await request.post("/auth/register").send(user);
    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe(user.username);
    expect(response.body.email).toBe(user.email);
    const validPassword = await bcrypt.compare(
      user.password,
      response.body.password
    );
    expect(validPassword).toBe(true);
    user._id = response.body._id;
  });

  test("Test Create User with duplicate email", async () => {
    const response = await request
      .post("/auth/register")
      .send({ ...user, username: "1" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Duplicate Key");
  });

  test("Test Create User with duplicate username", async () => {
    const response = await request
      .post("/auth/register")
      .send({ ...user, email: "1" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Duplicate Key");
  });

  test("Test Create user without username", async () => {
    const { username, ...rest } = user;
    const response = await request.post("/auth/register").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: username: Path `username` is required."
    );
  });

  test("Test Create user without email", async () => {
    const { email, ...rest } = user;
    const response = await request.post("/auth/register").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: email: Path `email` is required."
    );
  });

  test("Test Create user without password", async () => {
    const { password, ...rest } = user;
    const response = await request.post("/auth/register").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: password: Path `password` is required."
    );
  });

  test("Test Create user with username of empty string", async () => {
    const response = await request
      .post("/auth/register")
      .send({ ...user, username: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: username: Path `username` is required."
    );
  });

  test("Test Create user with email of empty string", async () => {
    const response = await request
      .post("/auth/register")
      .send({ ...user, email: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: email: Path `email` is required."
    );
  });

  test("Test Create user with password of empty string", async () => {
    const response = await request
      .post("/auth/register")
      .send({ ...user, password: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Users validation failed: password: Path `password` is required."
    );
  });

  test("Auth test login with username", async () => {
    const response = await request
      .post("/auth/login")
      .send({ username: user.username, password: user.password });
    expect(response.statusCode).toBe(200);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(response.body._id).toBe(user._id);
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
  });

  test("Check tokens are not the same", async () => {
    const response = await request.post("/auth/login").send(user);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).not.toBe(user.accessToken);
    expect(refreshToken).not.toBe(user.refreshToken);
  });

  test("Auth test login with email", async () => {
    const response = await request
      .post("/auth/login")
      .send({ email: user.email, password: user.password });
    expect(response.statusCode).toBe(200);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(response.body._id).toBe(user._id);
  });

  test("Login with not existing username", async () => {
    const response = await request
      .post("/auth/login")
      .send({ username: "HI", password: user.password });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("wrong username/email or password");
  });

  test("Login with not existing email", async () => {
    const response = await request
      .post("/auth/login")
      .send({ email: "HI", password: user.password });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("wrong username/email or password");
  });

  test("Login with not matching password", async () => {
    const response = await request
      .post("/auth/login")
      .send({ email: user.email, password: "no" });
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("wrong username/email or password");
  });

  test("Login with nothing", async () => {
    const response = await request.post("/auth/login").send({});
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("wrong username/email or password");
  });

  test("Auth test without token", async () => {
    const response = await request.get("/users");
    expect(response.statusCode).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("Auth test with token", async () => {
    const response = await request
      .get("/users")
      .set({ authorization: `JWT ${user.accessToken}` })
      .expect(200);
    expect(response.statusCode).toBe(200);
  });

  test("Test refresh token", async () => {
    const response = await request.post("/auth/refresh").send({
      refreshToken: user.refreshToken,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    expect(response.body.accessToken).not.toBe(user.accessToken);
    expect(response.body.refreshToken).not.toBe(user.refreshToken);

    user.accessToken = response.body.accessToken;
    user.refreshToken = response.body.refreshToken;
  });

  test("Double use refresh token", async () => {
    const response = await request.post("/auth/refresh").send({
      refreshToken: user.refreshToken,
    });
    expect(response.statusCode).toBe(200);

    const refreshTokenNew = response.body.refreshToken;
    const response2 = await request.post("/auth/refresh").send({
      refreshToken: user.refreshToken,
    });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request.post("/auth/refresh").send({
      refreshToken: refreshTokenNew,
    });
    expect(response3.statusCode).not.toBe(200);
  });

  test("Empty refresh token", async () => {
    const loginRes = await request.post("/auth/login").send(user);
    expect(loginRes.statusCode).toBe(200);
    user.accessToken = loginRes.body.accessToken;
    user.refreshToken = loginRes.body.refreshToken;

    const response = await request.post("/auth/refresh").send({});
    expect(response.statusCode).not.toBe(200);

    const response2 = await request.post("/auth/refresh").send({
      refreshToken: user.refreshToken,
    });
    expect(response2.statusCode).toBe(200);
    expect(response2.body.accessToken).toBeDefined();
    expect(response2.body.refreshToken).toBeDefined();

    expect(response2.body.accessToken).not.toBe(user.accessToken);
    expect(response2.body.refreshToken).not.toBe(user.refreshToken);

    user.accessToken = response2.body.accessToken;
    user.refreshToken = response2.body.refreshToken;
  });

  test("Test logout", async () => {
    const response = await request.post("/auth/logout").send({
      refreshToken: user.refreshToken,
    });
    expect(response.statusCode).toBe(200);

    const response2 = await request.post("/auth/refresh").send({
      refreshToken: user.refreshToken,
    });
    expect(response2.statusCode).not.toBe(200);
  });

  jest.setTimeout(10000);
  test("Test timeout token ", async () => {
    const response = await request.post("/auth/login").send(user);
    expect(response.statusCode).toBe(200);
    user.accessToken = response.body.accessToken;
    user.refreshToken = response.body.refreshToken;

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response2 = await request
      .post("/posts")
      .set({ authorization: "JWT " + user.accessToken })
      .send({
        title: "Test Post",
        content: "Test Content",
      });
    expect(response2.statusCode).not.toBe(201);

    const response3 = await request.post("/auth/refresh").send({
      refreshToken: user.refreshToken,
    });
    expect(response3.statusCode).toBe(200);

    user.accessToken = response3.body.accessToken;
    const response4 = await request
      .post("/posts")
      .set({ authorization: "JWT " + user.accessToken })
      .send({
        title: "Test Post",
        content: "Test Content",
      });
    expect(response4.statusCode).toBe(201);
  });
});