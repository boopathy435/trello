import { NextFunction, Response } from "express";
import { Server } from "socket.io";
import { getErrorMessage } from "../helpers";
import ColumnModel from "../models/column";
import { ExpressRequestInterface } from "../types/expressRequest.interface";
import { Socket } from "../types/socket.interface";
import { SocketEventsEnum } from "../types/socketEvents.enum";

export const getColumns = async (req: ExpressRequestInterface, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const columns = await ColumnModel.find({ boardId: req.params.boardId });
    res.send(columns);
  } catch (error) {
    next(error);
  }
};

export const createColumn = async (io: Server, socket: Socket, data: { boardId: string; title: string }) => {
  try {
    if (!socket.user) {
      socket.emit(SocketEventsEnum.columnsCreateFailure, "User is not authorized");
      return;
    }
    const newColumn = new ColumnModel({
      title: data.title,
      boardId: data.boardId,
      userId: socket.user.id,
    });
    const savedColumn = await newColumn.save();
    io.to(data.boardId).emit(SocketEventsEnum.columnsCreateSuccess, savedColumn);
    console.log("savedColumn:", savedColumn);
  } catch (error) {
    socket.emit(SocketEventsEnum.columnsCreateFailure, getErrorMessage(error));
  }
};

export const deleteColumn = async (io: Server, socket: Socket, data: { boardId: string; columnId: string }) => {
  try {
    if (!socket.user) {
      socket.emit(SocketEventsEnum.columnsDeleteFailure, "User is not authorized");
      return;
    }
    await ColumnModel.deleteOne({ _id: data.columnId });
    io.to(data.boardId).emit(SocketEventsEnum.columnsDeleteSuccess, data.columnId);
  } catch (error) {
    socket.emit(SocketEventsEnum.columnsDeleteFailure, getErrorMessage(error));
  }
};

export const updateColumn = async (io: Server, socket: Socket, data: { boardId: string; columnId: string; fields: { title: string } }) => {
  try {
    if (!socket.user) {
      socket.emit(SocketEventsEnum.columnsUpdateFailure, "User is not authorized");
      return;
    }
    const updatedColumn = await ColumnModel.findByIdAndUpdate(data.columnId, data.fields, { new: true });
    io.to(data.boardId).emit(SocketEventsEnum.columnsUpdateSuccess, updatedColumn);
    console.log("updatedColumn:", updatedColumn);
  } catch (error) {
    socket.emit(SocketEventsEnum.columnsUpdateFailure, getErrorMessage(error));
  }
};
