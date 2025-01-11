import { Document, Schema } from "mongoose";

export interface Board {
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: Schema.Types.ObjectId;
}

export interface BoardDocument extends Document, Board {}
