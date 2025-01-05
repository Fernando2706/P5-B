import MongoService from "./mongo_service.ts";
import { Comment, Post, User } from "./model/types_db.ts";
import {hash} from "bcrypt"
import { ObjectId } from "mongodb";


export const resolvers = {
  User: {
    id: (user: User) => user._id!.toString(),
    posts: async (user: User) => {
        const mongoService = new MongoService();
        return await mongoService.findByFilter<Post>("posts", {author: user._id}); 
    },
    comments: async (user: User) => {
        const mongoService = new MongoService();
        return await mongoService.findByFilter<Comment>("comments", {author: user._id});
    },
    likedPosts: async (user: User) => {
        const mongoService = new MongoService();
        return await mongoService.findByFilter<Post>("posts", {likes: user._id});
    },
  },
  Post: {
    id: (post: Post) => post._id!.toString(),
    author: async (post: Post) => {
        const mongoService = new MongoService();
        return await mongoService.findById<User>("users", post.author.toString());
    },
    comments: async (post: Post) => {
        const mongoService = new MongoService();
        return await mongoService.findByFilter<Comment>("comments", {post: post._id});
    },
    likes: async (post: Post) => {
        const mongoService = new MongoService();
        return await mongoService.findByFilter<User>("users", {_id: {$in: post.likes}});
    },
  },
  Comment: {
        id: (comment: Comment) => comment._id!.toString(),
        author: async (comment: Comment) => {
            const mongoService = new MongoService();
            return await mongoService.findById<User>("users", comment.author.toString());
        },
        post: async (comment: Comment) => {
            const mongoService = new MongoService();
            return await mongoService.findById<Post>("posts", comment.post.toString());
        }
  },
  Query: {
    users: async () => {
        const mongoService = new MongoService();
        return await mongoService.findAll<User>("users");
    },
    user: async (_: unknown, { id }: { id: string }) => {
        const mongoService = new MongoService();
        return await mongoService.findById<User>("users", id);
    },
    posts: async () => {
        const mongoService = new MongoService();
        return await mongoService.findAll<Post>("posts");
    },
    post: async (_: unknown, { id }: { id: string }) => {
        const mongoService = new MongoService();
        return await mongoService.findById<Post>("posts", id);
    },
    comments: async () => {
        const mongoService = new MongoService();
        return await mongoService.findAll<Comment>("comments");
    },
    comment: async (_: unknown, { id }: { id: string }) => {
        const mongoService = new MongoService();
        return await mongoService.findById<Comment>("comments", id);
    },
  },
   Mutation: {
    createUser: async (_: unknown, { input }: { input: CreateUserInput }) => {
        const mongoService = new MongoService();
        const hashedPassword = await hash(input.password);

        const isEmailAlreadyTaken = await mongoService.findByFilter<User>("users", {email: input.email});
        if (isEmailAlreadyTaken.length > 0) {
            throw new Error("Email already taken");
        }

        const isEmailFormatValid = validateEmail(input.email);
        if (!isEmailFormatValid) {
            throw new Error("Email format not valid");
        }

        return await mongoService.create<User>("users", {
          name: input.name,
          email: input.email,
          posts: [],
          comments: [],
          likedPosts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          password: hashedPassword
        });
    },
    updateUser: async (_: unknown, { id, input }: { id: string, input: UpdateUserInput }) => {
        const mongoService = new MongoService();
        const dataToUpdate: Record<string, any> = {};
        if (input.password) {
            const hashedPassword = await hash(input.password);
            dataToUpdate["password"] = hashedPassword;
        }
        if (input.name) {
            dataToUpdate["name"] = input.name;
        }
        if (input.email) {
            if (!validateEmail(input.email)) {
                throw new Error("Email format not valid");
            }
            dataToUpdate["email"] = input.email;
        }
        const result = await mongoService.updateById<User>("users", id, {
            "$set": dataToUpdate
        });

        if (!result) {
            throw new Error("User not found");
        }

        const user = await mongoService.findById<User>("users", id);
        return user;
    },
    deleteUser: async (_: unknown, { id }: { id: string }) => {
        const mongoService = new MongoService();
        return await mongoService.deleteById<User>("users", id);
    },
    createPost: async (_: unknown, { input }: { input: CreatePostInput }) => {
        const mongoService = new MongoService();

        const isAuthorOnDatabase = await mongoService.findByFilter<User>("users", {_id: new ObjectId(input.authorId)});

        if (isAuthorOnDatabase.length === 0) {
            throw new Error("Author not found");
        }

        return await mongoService.create<Post>("posts", {
            content: input.content,
            author: new ObjectId(input.authorId),
            comments: [],
            likes: [],
        });
    },
    updatePost: async (_: unknown, { id, input }: { id: string, input: UpdatePostInput }) => {
        const mongoService = new MongoService();
        const dataToUpdate: Record<string, any> = {};
        if (input.content) {
            dataToUpdate["content"] = input.content;
        }
        const result = await mongoService.updateById<Post>("posts", id, {
            "$set": dataToUpdate
        });

        if (!result) {
            throw new Error("Post not found");
        }

        const post = await mongoService.findById<Post>("posts", id);
        return post;
    },
    deletePost: async (_: unknown, { id }: { id: string }) => {
        const mongoService = new MongoService();
        return await mongoService.deleteById<Post>("posts", id);
    },
    addLikeToPost: async (_: unknown, { postId, userId }: { postId: string, userId: string }) => {
        const mongoService = new MongoService();
        const post = await mongoService.findById<Post>("posts", postId);
        if (!post) {
            throw new Error("Post not found");
        }

        const user = await mongoService.findById<User>("users", userId);
        if (!user) {
            throw new Error("User not found");
        }

        const newLikes = [...post.likes, new ObjectId(userId)];
        const result = await mongoService.updateById<Post>("posts", postId, {
            "$set": {
                likes: newLikes
            }
        });

        if (!result) {
            throw new Error("Post not found");
        }

        const newLikedPosts = [...user.likedPosts, new ObjectId(postId)];
        const result2 = await mongoService.updateById<User>("users", userId, {
            "$set": {
                likedPosts: newLikedPosts
            }
        });

        if (!result2) {
            throw new Error("User not found");
        }

        const newPost = await mongoService.findById<Post>("posts", postId);
        return newPost;
    },
    removeLikeFromPost: async (_: unknown, { postId, userId }: { postId: string, userId: string }) => {
        const mongoService = new MongoService();
        const post = await mongoService.findById<Post>("posts", postId);
        if (!post) {
            throw new Error("Post not found");
        }

        const user = await mongoService.findById<User>("users", userId);
        if (!user) {
            throw new Error("User not found");
        }

        const newLikes = post.likes.filter((id) => id.toString() !== userId);

        const result = await mongoService.updateById<Post>("posts", postId, {
            "$set": {
                likes: newLikes
            }
        });
        if (!result) {
            throw new Error("Post not found");
        }
        const newLikedPosts = user.likedPosts.filter((id) => id.toString() !== postId);
        const result2 = await mongoService.updateById<User>("users", userId, {
            "$set": {
                likedPosts: newLikedPosts
            }
        });

        if (!result2) {
            throw new Error("User not found");
        }

        const newPost = await mongoService.findById<Post>("posts", postId);
        return newPost;
    },
    createComment: async (_: unknown, { input }: { input: CreateCommentInput }) => {
        const mongoService = new MongoService();        
        const isAuthorOnDatabase = await mongoService.findByFilter<User>("users", {_id: new ObjectId(input.authorId)});

        if (isAuthorOnDatabase.length === 0) {
            throw new Error("Author not found");
        }

        const isPostOnDatabase = await mongoService.findByFilter<Post>("posts", {_id: new ObjectId(input.postId)});

        if (isPostOnDatabase.length === 0) {
            throw new Error("Post not found");
        }

        return await mongoService.create<Comment>("comments", {
            text: input.text,
            author: new ObjectId(input.authorId),
            post: new ObjectId(input.postId),
        });
    },
    updateComment: async (_: unknown, { id, input }: { id: string, input: UpdateCommentInput }) => {
        const mongoService = new MongoService();
        const dataToUpdate: Record<string, any> = {};
        if (input.text) {
            dataToUpdate["text"] = input.text;
        }

        const result = await mongoService.updateById<Comment>("comments", id, {
            "$set": dataToUpdate
        });        

        if (!result) {
            throw new Error("Comment not found");
        }

        const comment = await mongoService.findById<Comment>("comments", id);
        return comment; 
    },
    deleteComment: async (_: unknown, { id }: { id: string }) => {
        const mongoService = new MongoService();
        return await mongoService.deleteById<Comment>("comments", id);
    },
  },
};

const validateEmail = (email: string) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

type CreateUserInput = {
  name: string;
  password: string;
  email: string;
};

type UpdateUserInput = {
  name?: string;
  password?: string;
  email?: string;
};

type CreatePostInput = {
  content: string;
  authorId: string;
};

type UpdatePostInput = {
  content?: string;
};

type CreateCommentInput = {
  text: string;
  postId: string;
  authorId: string;
};

type UpdateCommentInput = {
  text?: string;
};
