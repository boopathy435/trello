import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { secret } from "../config";
import UserModel from "../models/user";
import { ExpressRequestInterface } from "../types/expressRequest.interface";

export default async (req: ExpressRequestInterface, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.sendStatus(401);
    }

    const token = authHeader?.split(" ")[1] as string;
    const data = jwt.verify(token, secret) as { id: string; email: string };
    const user = await UserModel.findById(data.id);

    if (!user) {
      res.sendStatus(401);
    }else{
        req.user = user;
    }

    next();
  } catch (error) {
    res.sendStatus(401);
  }
};
