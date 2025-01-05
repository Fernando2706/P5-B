import { ObjectId, OptionalId } from "mongodb";

export type User = OptionalId< {
  _id: string;
  name: string;
  email: string;
  password: string;
  posts: ObjectId[];
  comments: ObjectId[];
  likedPosts: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}>;

export type Post = OptionalId<{
    content: string;
    author: ObjectId;
    comments: ObjectId[];
    likes: ObjectId[];
}>

export type Comment = OptionalId<{
    text: string;
    author: ObjectId;
    post: ObjectId;
}>