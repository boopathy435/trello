import { NextFunction, Response } from "express";
import ColumnModel from "../models/column";
import { ExpressRequestInterface } from "../types/expressRequest.interface";
import { Server } from "socket.io";
import {Socket} from '../types/socket.interface'
import { SocketEventsEnum } from "../types/socketEvents.enum";
import { getErrorMessage } from "../helpers";

export const getColumns = async (req: ExpressRequestInterface, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const columns = await ColumnModel.find({ userId: req.user.id });
    res.send(columns);
  } catch (error) {
    next(error);
  }
};


export const createColumn = async (io: Server, socket: Socket, data: {boardId: string, title: string}) => {
    try {
      if (!socket.user) {
        socket.emit(SocketEventsEnum.columnsCreateFailure,"User is not authorized");
        return;
      }
      const newColumn = new ColumnModel({
        title: data.title,
        boardId: data.boardId,
        userId: socket.user.id
      })
      const savedColumn = await newColumn.save();
      io.to(data.boardId).emit(SocketEventsEnum.columnsCreateSuccess,savedColumn);
      console.log('savedColumn:',savedColumn);
    } catch (error) {
      socket.emit(SocketEventsEnum.columnsCreateFailure,getErrorMessage(error));
    }
  };