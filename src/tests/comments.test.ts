import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import commentsModel from "../models/commentsModel";
import { Express } from "express";
import postModel from "../models/postModel";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await commentsModel.deleteMany();
  await postModel.deleteMany();
  const userResponse = await request(app).post("/users").send({
    username: "Hadar Lachmy",
    email: "Hadar@gmail.com",
    password: "secret",
  });
  comment.sender = userResponse.body._id;
  const postResponse = await request(app).post("/posts").send({
    title: "Test Post",
    content: "Test Content",
    sender: userResponse.body._id,
  });
  comment.postId = postResponse.body._id;
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let commentId = "";
const comment = {
  content: "This is a comment",
  sender: "",
  postId: "",
};

describe("Comments Tests", () => {
  test("Comments test get all", async () => {
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Comment", async () => {
    const response = await request(app).post("/comments").send(comment);
    expect(response.statusCode).toBe(201);
    expect(response.body.content).toBe(comment.content);
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.sender).toBe(comment.sender);
    commentId = response.body._id;
  });

  test("Test Create Comment without post id", async () => {
    const { postId, ...rest } = comment;
    const response = await request(app).post("/comments").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: postId: Path `postId` is required."
    );
  });

  test("Test Create Comment without sender", async () => {
    const { sender, ...rest } = comment;
    const response = await request(app).post("/comments").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: sender: Path `sender` is required."
    );
  });

  test("Test Create Comment without content", async () => {
    const { content, ...rest } = comment;
    const response = await request(app).post("/comments").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: content: Path `content` is required."
    );
  });

  test("Test Create Comment with post id of empty string", async () => {
    const response = await request(app)
      .post("/comments")
      .send({ ...comment, postId: null });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: postId: Path `postId` is required."
    );
  });

  test("Test Create Comment with sender of empty string", async () => {
    const response = await request(app)
      .post("/comments")
      .send({ ...comment, sender: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: sender: Path `sender` is required."
    );
  });

  test("Test Create Comment with content of empty string", async () => {
    const response = await request(app)
      .post("/comments")
      .send({ ...comment, content: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: content: Path `content` is required."
    );
  });

  test("Comments test get all", async () => {
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].content).toBe(comment.content);
    expect(response.body[0].postId).toBe(comment.postId);
    expect(response.body[0].sender).toBe(comment.sender);
  });

  test("Test get comment by sender", async () => {
    const response = await request(app).get(
      `/comments?sender=${comment.sender}`
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].content).toBe(comment.content);
    expect(response.body[0].postId).toBe(comment.postId);
    expect(response.body[0].sender).toBe(comment.sender);
  });

  test("Comments get post by id", async () => {
    const response = await request(app).get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(comment.content);
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.sender).toBe(comment.sender);
  });

  test("Test get comment by post id", async () => {
    const response = await request(app).get(
      `/comments?postId=${comment.postId}`
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].content).toBe(comment.content);
    expect(response.body[0].postId).toBe(comment.postId);
    expect(response.body[0].sender).toBe(comment.sender);
  });

  test("Test Update Comment", async () => {
    const response = await request(app).put(`/comments/${commentId}`).send({
      content: "The beginning of a new era",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.content).toBe("The beginning of a new era");
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.sender).toBe(comment.sender);
  });

  test("Test Delete Comment", async () => {
    const response = await request(app).delete(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
  });

  test("Test get comment by id that doesn't exist", async () => {
    const response = await request(app).get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test update comment with not existing id", async () => {
    const response = await request(app).put(`/comments/${commentId}`).send({
      content: "HI there",
    });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Create Comment with sender that does not exist", async () => {
    await request(app).delete(`/users/${comment.sender}`);
    const response = await request(app).post("/comments").send(comment);
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Sender not found");
  });

  test("Test Create Comment to post that does not exist", async () => {
    await request(app).delete(`/posts/${comment.postId}`);
    const response = await request(app).post("/comments").send(comment);
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Post not found");
  });
});