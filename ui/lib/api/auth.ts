import { AuthResponse, CreateUser, SigninUser } from "../schemas/auth";
import { Api } from "./api";

export type CheckUsernameResponse = {
  message: string;
};

export const CheckUsername = async (username: string) => {
  const resp = await Api.get<CheckUsernameResponse>(
    `/auth/checkusername/${username}`,
  );
  return resp.data;
};

export const Signup = async (data: CreateUser) => {
  const resp = await Api.post("/auth/signup", data);
  return resp.data;
};

export const Signin = async (data: SigninUser) => {
  const resp = await Api.post<AuthResponse>("/auth/signin", data);
  return resp.data;
};
