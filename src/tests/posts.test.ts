import supertest, { Agent } from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/postModel";
import { Express } from "express";
import userModel, { IUser } from "../models/userModel";

var app: Express;
var request: Agent;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await postModel.deleteMany();
  await userModel.deleteMany();

  type UserLogin = {
    _id?: string;
    email: string;
    password: string;
  };

  type UserRegister = UserLogin & {
    username: string;
    avatarURL: string;
  };

  const user: UserLogin = {
    email: "test@user.com",
    password: "testpassword",
  };

  const UserRegisterInstance: UserRegister = {
    email: "test@user.com",
    password: "testpassword",
    username: "Batman",
    avatarURL: "/public/some.png",
  };
  await supertest(app).post("/auth/register").send(UserRegisterInstance);
  const res = await supertest(app).post("/auth/login").send(user);
  userId = res.body._id;
  const token = res.body.accessToken;
  expect(token).toBeDefined();

  request = supertest.agent(app).set({ authorization: token });
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let userId = "";
let postId = "";
const post = {
  breed: "Test Post",
  content: "Test Content",
};

describe("Posts Tests", () => {
  test("Posts test get all", async () => {
    const response = await request.get("/posts");
    expect(response.statusCode).toBe(200);
  });

  test("Test Create Post", async () => {
    const response = await request.post("/posts").send(post);
    expect(response.statusCode).toBe(201);
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
    postId = response.body._id;
  });

  test("Test Create Post without breed", async () => {
    const { breed: breed, ...rest } = post;
    const response = await request.post("/posts").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: breed: Path `breed` is required."
    );
  });

  test("Test Create Post with breed of empty string", async () => {
    const response = await request.post("/posts").send({ ...post, breed: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: breed: Path `breed` is required."
    );
  });

  test("Test Create Post without content", async () => {
    const { content, ...rest } = post;
    const response = await request.post("/posts").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: content: Path `content` is required."
    );
  });

  test("Test Create Post with content of empty string", async () => {
    const response = await request
      .post("/posts")
      .send({ ...post, content: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: content: Path `content` is required."
    );
  });

  test("Test get post by userId", async () => {
    const response = await request.get(`/posts?userId=${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].breed).toBe(post.breed);
    expect(response.body[0].content).toBe(post.content);
    expect(response.body[0].userId).toBe(userId);
  });

  test("Test get post by id", async () => {
    const response = await request.get(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
  });

  test("Test like post by id", async () => {
    const response = await request.put(`/posts/like/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body.likeBy)).toBe(JSON.stringify([]));
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
  });

  test("Test dislike post by id", async () => {
    const response = await request.put(`/posts/like/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body.likeBy)).toBe(JSON.stringify([`${userId}`]));
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
  });

  test("Test Update Post's breed", async () => {
    const response = await request.put(`/posts/${postId}`).send({
      breed: "The beginning of a new era",
    });
    post.breed = "The beginning of a new era";
    expect(response.statusCode).toBe(201);
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
  });

  test("Test Update Post's Content", async () => {
    const response = await request.put(`/posts/${postId}`).send({
      content: "Welcome back today!",
    });
    post.content = "Welcome back today!";
    expect(response.statusCode).toBe(201);
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
  });

  test("Test get all posts", async () => {
    const response = await request.get(`/posts`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].breed).toBe(post.breed);
    expect(response.body[0].content).toBe(post.content);
    expect(response.body[0].userId).toBe(userId);
  });

  test("Test Create Post 2", async () => {
    const response = await request.post("/posts").send({
      breed: "Test Post 2",
      content: "Test Content 2",
    });
    expect(response.statusCode).toBe(201);
  });

  test("Posts test get all 2", async () => {
    const response = await request.get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("Test Delete Post", async () => {
    const response = await request.delete(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.breed).toBe(post.breed);
    expect(response.body.content).toBe(post.content);
    expect(response.body.userId).toBe(userId);
  });

  test("Test get post by id that doesn't exist", async () => {
    const response = await request.get(`/posts/${postId}`);
    expect(response.statusCode).toBe(404);
  });

  test("Test Update Post with not existing id", async () => {
    const response = await request.put(`/posts/${postId}`).send({
      breed: "Test Post",
    });
    expect(response.statusCode).toBe(404);
  });
});