import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/postModel";
import { Express } from "express";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await postModel.deleteMany();
  const userResponse = await request(app).post("/users").send({
    username: "Hadar",
    email: "H@gmail.com",
    password: "secret",
  });
  post.sender = userResponse.body._id;
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let postId = "";
const post = {
  title: "Test Post",
  content: "Test Content",
  sender: "",
};

describe("Posts Tests", () => {
  test("Posts test get all", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Post", async () => {
    const response = await request(app).post("/posts").send(post);
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(post.sender);
    postId = response.body._id;
  });

  test("Test Create Post without title", async () => {
    const { title, ...rest } = post;
    const response = await request(app).post("/posts").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: title: Path `title` is required."
    );
  });

  test("Test Create Post without sender", async () => {
    const { sender, ...rest } = post;
    const response = await request(app).post("/posts").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: sender: Path `sender` is required."
    );
  });

  test("Test Create Post with title of empty string", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ ...post, title: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: title: Path `title` is required."
    );
  });

  test("Test Create Post with sender of empty string", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ ...post, sender: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: sender: Path `sender` is required."
    );
  });

  test("Test get post by sender", async () => {
    const response = await request(app).get(`/posts?sender=${post.sender}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe(post.title);
    expect(response.body[0].content).toBe(post.content);
    expect(response.body[0].sender).toBe(post.sender);
  });

  test("Test get post by id", async () => {
    const response = await request(app).get(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(post.sender);
  });

  test("Test Update Post's Title", async () => {
    const response = await request(app).put(`/posts/${postId}`).send({
      title: "The beginning of a new era",
    });
    post.title = "The beginning of a new era";
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(post.sender);
  });

  test("Test Update Post's Content", async () => {
    const response = await request(app).put(`/posts/${postId}`).send({
      content: "Welcome back today!",
    });
    post.content = "Welcome back today!";
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(post.sender);
  });

  test("Test get all posts", async () => {
    const response = await request(app).get(`/posts`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe(post.title);
    expect(response.body[0].content).toBe(post.content);
    expect(response.body[0].sender).toBe(post.sender);
  });

  test("Test Create Post 2", async () => {
    const response = await request(app).post("/posts").send({
      title: "Test Post 2",
      content: "Test Content 2",
      sender: post.sender,
    });
    expect(response.statusCode).toBe(201);
  });

  test("Posts test get all 2", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("Test Delete Post", async () => {
    const response = await request(app).delete(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
  });

  test("Test get post by id that doesn't exist", async () => {
    const response = await request(app).get(`/posts/${postId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Update Post with not existing id", async () => {
    const response = await request(app).put(`/posts/${postId}`).send({
      title: "Test Post",
    });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Create Post with sender that does not exist", async () => {
    await request(app).delete(`/users/${post.sender}`);
    const response = await request(app).post("/posts").send(post);
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Sender not found");
  });
});