import { User } from "../schemas";
import { Api } from "./api";

export class UserApiService {
  static async getUsers(q: string) {
    const resp = await Api.get<User[]>(`/users/search?q=${q}`);
    return resp.data;
  }
}
