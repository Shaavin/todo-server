import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import tasksRouter from "./routes/tasks";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/tasks", tasksRouter);

app.get("/health-check", (_: Request, res: Response) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
