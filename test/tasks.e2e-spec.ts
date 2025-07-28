import { PrismaClient } from "../prisma/generated/client";
import request from "supertest";
import express from "express";
import tasksRouter from "../src/routes/tasks";

describe("Tasks (E2E)", () => {
  let prisma: PrismaClient;
  let app: express.Application;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Create test app
    app = express();
    app.use(express.json());
    app.use("/tasks", tasksRouter);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any test data
    await prisma.task.deleteMany({});
  });

  describe("GET /tasks", () => {
    it("should return empty array when no tasks exist", async () => {
      const response = await request(app).get("/tasks");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return only non-deleted tasks", async () => {
      // Create active and deleted tasks
      const activeTask = await prisma.task.create({
        data: { title: "Active Task", color: "BLUE" },
      });
      const deletedTask = await prisma.task.create({
        data: { title: "Deleted Task", color: "RED", deleted: new Date() },
      });

      const response = await request(app).get("/tasks");
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(activeTask.id);
      expect(response.body[0].title).toBe("Active Task");
    });
  });

  describe("POST /tasks", () => {
    it("should create a new task with required fields", async () => {
      const newTask = { title: "Test Task" };
      const response = await request(app).post("/tasks").send(newTask);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Test Task");
      expect(response.body.completed).toBeNull();
      expect(response.body.color).toBeNull();
      expect(response.body.deleted).toBeNull();
    });

    it("should create a task with all optional fields", async () => {
      const newTask = {
        title: "Complete Task",
        color: "GREEN",
        completed: new Date().toISOString(),
      };
      const response = await request(app).post("/tasks").send(newTask);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("Complete Task");
      expect(response.body.color).toBe("GREEN");
      expect(response.body.completed).toBeDefined();
    });

    it("should return 400 when title is missing", async () => {
      const response = await request(app).post("/tasks").send({ color: "RED" });
      expect(response.status).toBe(400);
      expect(response.text).toBe("Title and description are required");
    });

    it("should return 400 when body is empty", async () => {
      const response = await request(app).post("/tasks").send({});
      expect(response.status).toBe(400);
    });
  });

  describe("PUT /tasks/:id", () => {
    it("should create a new task when ID doesn't exist", async () => {
      const taskData = { title: "New Task", color: "PURPLE" };
      const response = await request(app)
        .put("/tasks/non-existent-id")
        .send(taskData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("New Task");
      expect(response.body.color).toBe("PURPLE");
      expect(response.body.id).toBe("non-existent-id");
    });

    it("should update existing task", async () => {
      const existingTask = await prisma.task.create({
        data: { title: "Original Title", color: "BLUE" },
      });

      const updateData = { title: "Updated Title", color: "RED" };
      const response = await request(app)
        .put(`/tasks/${existingTask.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Title");
      expect(response.body.color).toBe("RED");
      expect(response.body.id).toBe(existingTask.id);
    });

    it("should restore soft-deleted task", async () => {
      const deletedTask = await prisma.task.create({
        data: { title: "Deleted Task", deleted: new Date() },
      });

      const updateData = { title: "Restored Task" };
      const response = await request(app)
        .put(`/tasks/${deletedTask.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Restored Task");
      expect(response.body.deleted).toBeNull();
    });

    it("should return 400 when title is missing", async () => {
      const response = await request(app)
        .put("/tasks/some-id")
        .send({ color: "BLUE" });
      expect(response.status).toBe(400);
      expect(response.text).toBe("Title is required");
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("should soft delete an existing task", async () => {
      const task = await prisma.task.create({
        data: { title: "Task to Delete", color: "ORANGE" },
      });

      const response = await request(app).delete(`/tasks/${task.id}`);
      expect(response.status).toBe(204);

      // Verify task is soft deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask?.deleted).toBeDefined();

      // Verify task doesn't appear in GET requests
      const getResponse = await request(app).get("/tasks");
      expect(getResponse.body).toHaveLength(0);
    });

    it("should return 404 for non-existent task", async () => {
      const response = await request(app).delete("/tasks/non-existent-id");
      expect(response.status).toBe(404);
      expect(response.text).toBe("Task not found");
    });

    it("should return 404 for already deleted task", async () => {
      const deletedTask = await prisma.task.create({
        data: { title: "Already Deleted", deleted: new Date() },
      });

      const response = await request(app).delete(`/tasks/${deletedTask.id}`);
      expect(response.status).toBe(404);
      expect(response.text).toBe("Task not found");
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid color values gracefully", async () => {
      const response = await request(app).post("/tasks").send({
        title: "Task with invalid color",
        color: "INVALID_COLOR",
      });

      // Should return 400 for invalid color
      expect(response.status).toBe(400);
      expect(response.text).toBe("Invalid color value");
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/tasks")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });
  });
});
