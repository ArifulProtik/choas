import React, { useState } from "react";
import { Input } from "../ui";
import { useQuery } from "@tanstack/react-query";
import { UserApiService } from "@/lib/api/user";

const UserSearch = () => {
  const [query, setQeury] = useState("");

  const { data, isFetched } = useQuery({
    queryKey: ["search-user", query],
    queryFn: () => UserApiService.getUsers(query),
    enabled: query.length > 3,
  });
  if (isFetched) {
    console.log(data);
  }
  return (
    <div>
      <div className="p-2">
        <Input
          onChange={(e) => {
            setQeury(e.target.value);
          }}
          placeholder="Search User"
        />
      </div>
      <div className="p-2 flex flex-col gap-1"></div>
    </div>
  );
};

export default UserSearch;
