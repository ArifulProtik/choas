export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  pronouns?: string;
  bio?: string;
  is_friend?: boolean;
  is_blocked?: boolean;
  avatar_url?: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
};
