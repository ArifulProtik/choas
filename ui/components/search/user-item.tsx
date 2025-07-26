import React from "react";
import { Avatar, AvatarFallback, Button } from "../ui";
import { AvatarImage } from "@radix-ui/react-avatar";
import { UserPlus } from "lucide-react";
import { User } from "@/lib/schemas";

type Props = {
  user: User;
};

const UserItem = (props: Props) => {
  return (
    <div className="p-2 flex flex-row gap-2 items-center hover:bg-muted hover:rounded border rounded">
      <Avatar>
        <AvatarImage src={"https://i.pravatar.cc/150?u=a042581f4e29026704"} />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>

      <div className="flex flex-col">
        <div className="text-sm font-semibold">Md Ariful Islam Protik</div>
        <div className="text-xs text-gray-500">john.doe@example.com</div>
      </div>

      <div className="ml-auto">
        <Button size={"icon"}>
          <UserPlus />
        </Button>
      </div>
    </div>
  );
};

export default UserItem;
