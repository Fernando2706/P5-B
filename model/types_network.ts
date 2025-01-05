
export interface UserNetwork {
  id: string;
  name: string;
  email: string;
  password: string;
  posts: [PostNetwork];
  comments: [CommentNetwork];
  likedPosts: [PostNetwork];
}

export interface PostNetwork {
  id: string;
  title: string;
  content: string;
  author: UserNetwork;
  comments: [CommentNetwork];
  likes: [UserNetwork];
}

export interface CommentNetwork {
  id: string;
  text: string;
  author: UserNetwork;
  post: PostNetwork;
}
