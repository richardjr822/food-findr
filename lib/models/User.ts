import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
  provider?: "credentials" | "google";
  googleId?: string;
}