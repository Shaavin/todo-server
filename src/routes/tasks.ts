import express, { Request, Response } from "express";
import { PrismaClient, Color } from "../../prisma/generated/client";

const router = express.Router();
const prisma = new PrismaClient();

// All supported task colors.
const validColors = Object.values(Color);

/**
 * Helper function to validate if a color value is supported.
 */
function isValidColor(color: any): boolean {
  return validColors.includes(color);
}

/**
 * Retrieves all tasks that are not soft-deleted.
 */
router.get("/", async (_: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { deleted: null },
  });
  return res.json(tasks);
});

/**
 * Creates a new task.
 * Expects a JSON body with a field "title" and optional "color" and "completed" fields.
 */
router.post("/", async (req: Request, res: Response) => {
  const newTask = req.body;
  if (!newTask.title) {
    return res.status(400).send("Title and description are required");
  }

  // Validate color if provided
  if (newTask.color && !isValidColor(newTask.color)) {
    return res.status(400).send("Invalid color value");
  }

  const createdTask = await prisma.task.create({
    data: {
      title: newTask.title,
      color:
        newTask.color && isValidColor(newTask.color) ? newTask.color : null,
      completed: newTask.completed || null,
    },
  });
  return res.status(201).json(createdTask);
});

/**
 * Upserts a task by ID, updating if it exists or creating a new one.
 * Expects a JSON body with a field "title" and optional "color" and "completed" fields.
 */
router.put("/:id", async (req: Request, res: Response) => {
  if (!req.body.title) {
    return res.status(400).send("Title is required");
  }

  // Validate color if provided
  if (req.body.color && !isValidColor(req.body.color)) {
    return res.status(400).send("Invalid color value");
  }

  const taskId = req.params.id;
  const matchingTask = await prisma.task.findUnique({
    where: { id: taskId },
  });

  const updatedTask = await prisma.task.upsert({
    where: { id: taskId },
    update: {
      title: req.body.title,
      color:
        req.body.color !== undefined
          ? isValidColor(req.body.color)
            ? req.body.color
            : null
          : matchingTask?.color,
      completed:
        req.body.completed !== undefined
          ? req.body.completed
          : matchingTask?.completed,
      deleted: null,
    },
    create: {
      id: taskId,
      title: req.body.title,
      color:
        req.body.color && isValidColor(req.body.color) ? req.body.color : null,
      completed: req.body.completed || null,
      deleted: null,
    },
  });
  return res.json(updatedTask);
});

/**
 * Soft deletes a task.
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const matchingTask = await prisma.task.findUnique({
    where: { id: taskId },
  });
  if (!matchingTask || matchingTask.deleted) {
    return res.status(404).send("Task not found");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { deleted: new Date() },
  });
  return res.status(204).send();
});

export default router;
