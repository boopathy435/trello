import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { secret } from "./config";
import * as boardsController from "./controllers/boards";
import * as columnsController from "./controllers/columns";
import * as tasksController from "./controllers/tasks";
import * as usersController from "./controllers/users";
import authMiddleware from "./middlewares/auth";
import User from "./models/user";
import { Socket } from "./types/socket.interface";
import { SocketEventsEnum } from "./types/socketEvents.enum";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set("toJSON", {
  virtuals: true,
  transform: (_, converted) => {
    delete converted._id;
  },
});

app.get("/", (req, res) => {
  res.send("API is UP");
});

app.post("/api/users", usersController.register);
app.post("/api/users/login", usersController.login);
app.get("/api/user", authMiddleware, usersController.currentUser as any);
app.get("/api/boards", authMiddleware, boardsController.getBoards as any);
app.get("/api/boards/:boardId", authMiddleware, boardsController.getBoard as any);
app.post("/api/boards", authMiddleware, boardsController.createBoard as any);

app.get("/api/boards/:boardId/columns", authMiddleware, columnsController.getColumns as any);
app.get("/api/boards/:boardId/tasks", authMiddleware, tasksController.getTasks as any);

io.use(async (socket: Socket, next) => {
  try {
    const token = (socket.handshake.auth.token as string) ?? "";
    const data = jwt.verify(token.split(" ")[1], secret) as {
      id: string;
      email: string;
    };

    const user = await User.findById(data.id);

    if (!user) {
      return next(new Error("Authentication Error"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication Error"));
  }
}).on("connection", (socket) => {
  socket.on(SocketEventsEnum.boardsJoin, (data) => {
    boardsController.joinBoard(io, socket, data);
  });

  socket.on(SocketEventsEnum.boardsLeave, (data) => {
    boardsController.leaveBoard(io, socket, data);
  });

  socket.on(SocketEventsEnum.columnsCreate, (data) => {
    columnsController.createColumn(io, socket, data);
  });

  socket.on(SocketEventsEnum.tasksCreate, (data) => {
    tasksController.createTask(io, socket, data);
  });

  socket.on(SocketEventsEnum.boardsUpdate, (data) => {
    boardsController.updateBoard(io, socket, data);
  });
});

mongoose.connect("mongodb://localhost:27017/eltrello").then(() => {
  console.log("connected to mongodb");
  httpServer.listen(4001, () => {
    console.log(`API is listening on port 4001`);
  });
});
