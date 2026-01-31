import supertest, { Agent } from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import commentsModel from "../models/commentsModel";
import { Express } from "express";
import postModel from "../models/postsModel";
import userModel, { IUser } from "../models/usersModel";

var app: Express;
var request: Agent;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
  await commentsModel.deleteMany();
  await postModel.deleteMany();
  await userModel.deleteMany();

  const testUser: IUser = {
    username: "Batman",
    email: "Batman@gmail.com",
    password: "secret",
    avatarURL: "/public/some.png",
    timestamp: new Date(),
  };
  await supertest(app).post("/auth/register").send(testUser);
  const res = await supertest(app).post("/auth/login").send(testUser);
  userId = res.body._id;
  const token = res.body.accessToken;
  expect(token).toBeDefined();

  request = supertest.agent(app).set({ authorization: `${token}` });

  const postResponse = await request.post("/posts").send({
    breed: "Test Post",
    content: "Test Content",
  });
  comment.postId = postResponse.body._id;
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

let userId = "";
let commentId = "";
const comment = {
  content: "This is a comment",
  postId: "",
};

describe("Comments Tests", () => {
  test("Comments test get all", async () => {
    const response = await request.get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Comment", async () => {
    const response = await request.post("/comments").send(comment);
    expect(response.statusCode).toBe(201);
    expect(response.body.content).toBe(comment.content);
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.userId).toBe(userId);
    commentId = response.body._id;
  });

  test("Test Create Comment without post id", async () => {
    const { postId, ...rest } = comment;
    const response = await request.post("/comments").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: postId: Path `postId` is required."
    );
  });

  test("Test Create Comment without content", async () => {
    const { content, ...rest } = comment;
    const response = await request.post("/comments").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: content: Path `content` is required."
    );
  });

  test("Test Create Comment with post id of empty string", async () => {
    const response = await request
      .post("/comments")
      .send({ ...comment, postId: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: postId: Path `postId` is required."
    );
  });

  test("Test Create Comment with content of empty string", async () => {
    const response = await request
      .post("/comments")
      .send({ ...comment, content: "" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Comments validation failed: content: Path `content` is required."
    );
  });

  test("Comments test get all", async () => {
    const response = await request.get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].content).toBe(comment.content);
    expect(response.body[0].postId).toBe(comment.postId);
    expect(response.body[0].userId).toBe(userId);
  });

  test("Test get comment by sender", async () => {
    const response = await request.get(`/comments?sender=${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].content).toBe(comment.content);
    expect(response.body[0].postId).toBe(comment.postId);
    expect(response.body[0].userId).toBe(userId);
  });

  test("Comments get post by id", async () => {
    const response = await request.get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(comment.content);
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.userId).toBe(userId);
  });

  test("Test get comment by post id", async () => {
    const response = await request.get(`/comments?postId=${comment.postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].content).toBe(comment.content);
    expect(response.body[0].postId).toBe(comment.postId);
    expect(response.body[0].userId).toBe(userId);
  });

  test("Test Update Comment", async () => {
    const response = await request.put(`/comments/${commentId}`).send({
      content: "The beginning of a new era",
    });
    comment.content = "The beginning of a new era";
    expect(response.statusCode).toBe(201);
    expect(response.body.content).toBe(comment.content);
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.userId).toBe(userId);
  });

  test("Test Delete Comment", async () => {
    const response = await request.delete(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(comment.content);
    expect(response.body.postId).toBe(comment.postId);
    expect(response.body.userId).toBe(userId);
  });

  test("Test get comment by id that doesn't exist", async () => {
    const response = await request.get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test update comment with not existing id", async () => {
    const response = await request.put(`/comments/${commentId}`).send({
      content: "HI there",
    });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Create Comment to post that does not exist", async () => {
    await request.delete(`/posts/${comment.postId}`);
    const response = await request.post("/comments").send(comment);
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Post not found");
  });
});