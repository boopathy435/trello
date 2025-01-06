import { NextFunction, Request, Response } from "express";
import UserModel from '../models/user';
import { UserDocument } from "../types/user.interface";

const normalizeUser = (user: UserDocument) => {
    return {
        email: user.email,
        username: user.username,
        id: user.id
    }
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newUser = new UserModel({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
    });
    const savedUser = await newUser.save();
    res.send(normalizeUser(savedUser))
  } catch (err) {
    next(err);
  }
};
