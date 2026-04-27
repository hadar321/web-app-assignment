import fs from "fs";
import path from "path";
import supertest, { Agent } from "supertest"
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/postModel";
import { Express } from "express";
import userModel, { IUser } from "../models/userModel";

const testUploadRoot = path.join(process.cwd(), "test_uploads_posts");

const cleanupUploadDirs = () => {
  if (fs.existsSync(testUploadRoot)) {
    fs.rmSync(testUploadRoot, { recursive: true, force: true });
  }
};

var app: Express;
var request: Agent;

beforeAll(async () => {
  console.log("beforeAll");
  process.env.USER_PROFILE_IMAGES_DIR = path.join(testUploadRoot, "userProfileImages");
  process.env.POST_IMAGES_DIR = path.join(testUploadRoot, "postImages");
  cleanupUploadDirs();
  app = await initApp();
  await postModel.deleteMany();

  await userModel.deleteMany();
  
  const testUser: IUser = {
    username: "Hadar",
    email: "H@gmail.com",
    password: "secret",
 }
  await supertest(app).post("/auth/register").send(testUser);
  const res = await supertest(app).post("/auth/login").send(testUser);
  console.log("aaaa")
  console.log(res.body)
  senderId = res.body._id;
  const token = res.body.accessToken;
  expect(token).toBeDefined();

  request = supertest.agent(app).set({ authorization: `JWT ${token}` });
});

afterAll((done) => {
  console.log("afterAll");
  cleanupUploadDirs();
  mongoose.connection.close();
  done();
});
let senderId = "";
let postId = "";
const post = {
  title: "Test Post",
  content: "Test Content",
};

describe("Posts Tests", () => {
  test("Posts test get all", async () => {
    const response = await request.get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test Create Post", async () => {
    const response = await request.post("/posts").send(post);
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(senderId);
    postId = response.body._id;
  });

  test("Test Create Post without title", async () => {
    const { title, ...rest } = post;
    const response = await request.post("/posts").send(rest);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: title: Path `title` is required."
    );
  });

   test("Test Create Post with title of empty string", async () => {
    const response = await request
      .post("/posts")
      .send({ ...post, title: "" });``
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Posts validation failed: title: Path `title` is required."
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

  test("Test get post by sender", async () => {
    const response = await request.get(`/posts?sender=${senderId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe(post.title);
    expect(response.body[0].content).toBe(post.content);
    expect(response.body[0].sender).toBe(senderId);
  });

  test("Test get post by id", async () => {
    const response = await request.get(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(senderId);
  });

  test("Test Update Post's Title", async () => {
    const response = await request.put(`/posts/${postId}`).send({
      title: "The beginning of a new era",
    });
    post.title = "The beginning of a new era";
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(senderId);
  });

  test("Test Update Post's Content", async () => {
    const response = await request.put(`/posts/${postId}`).send({
      content: "Welcome back today!",
    });
    post.content = "Welcome back today!";
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(senderId);
  });

  test("Test get all posts", async () => {
    const response = await request.get(`/posts`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe(post.title);
    expect(response.body[0].content).toBe(post.content);
    expect(response.body[0].sender).toBe(senderId);
  });

  test("Test Create Post 2", async () => {
    const response = await request.post("/posts").send({
      title: "Test Post 2",
      content: "Test Content 2",
    });
    expect(response.statusCode).toBe(201);
  });

  test("Test Create Post with image", async () => {
    const response = await request
      .post("/posts")
      .field("title", "Test Post Image")
      .field("content", "Test Content Image")
      .attach("postImage", Buffer.from("dummy image data"), "post-image.png");

    expect(response.statusCode).toBe(201);
    const expectedDir = (process.env.POST_IMAGES_DIR || 'postImages').replace(/\\/g, '\\\\');
    expect(response.body.postImage).toMatch(new RegExp(`^${expectedDir}/`));
  });

  test("Test Update Post image", async () => {
    const response = await request
      .put(`/posts/${postId}`)
      .attach("postImage", Buffer.from("updated image data"), "updated-post.png");

    expect(response.statusCode).toBe(201);
    const expectedDir = (process.env.POST_IMAGES_DIR || 'postImages').replace(/\\/g, '\\\\');
    expect(response.body.postImage).toMatch(new RegExp(`^${expectedDir}/`));
  });

  test("Posts test get all 2", async () => {
    const response = await request.get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(3);
  });

  test("Test Delete Post", async () => {
    const response = await request.delete(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    expect(response.body.sender).toBe(senderId);
  });

  test("Test get post by id that doesn't exist", async () => {
    const response = await request.get(`/posts/${postId}`);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  test("Test Update Post with not existing id", async () => {
    const response = await request.put(`/posts/${postId}`).send({
      title: "Test Post",
    });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("not found");
  });

  // Pagination tests
  test("Test pagination - create multiple posts", async () => {
    // Create 14 more posts to have 16 total posts after deleting the original post.
    for (let i = 1; i <= 14; i++) {
      await request.post("/posts").send({
        title: `Page Post ${i}`,
        content: `Page Content ${i}`,
      });
    }
  });

  test("Test pagination - first page default limit", async () => {
    const response = await request.get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(10); // Default limit is 10
  });

  test("Test pagination - second page with limit 5", async () => {
    const response = await request.get("/posts?pageNum=2&limit=5");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(5);
    expect(response.body[0].title).toBe("Page Post 4");
    expect(response.body[4].title).toBe("Page Post 8");
  });

  test("Test pagination - third page with limit 3", async () => {
    const response = await request.get("/posts?pageNum=3&limit=3");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(3);
    expect(response.body[0].title).toBe("Page Post 5");
    expect(response.body[2].title).toBe("Page Post 7");
  });

  test("Test pagination - page beyond available data", async () => {
    const response = await request.get("/posts?pageNum=10&limit=5");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0); // No more posts
  });

  test("Test pagination with filtering by sender", async () => {
    const response = await request.get(`/posts?sender=${senderId}&pageNum=1&limit=5`);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(5);
    // All posts should be from the same sender
    response.body.forEach((post: any) => {
      expect(post.sender).toBe(senderId);
    });
  });
});