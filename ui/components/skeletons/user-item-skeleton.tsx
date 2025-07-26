import React from "react";
import { Skeleton } from "../ui/skeleton";

const UserItemSkeleton = () => {
  return (
    <div className="p-2 flex items-center gap-2 border">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-2 w-28" />
        <Skeleton className="h-2 w-20" />
      </div>
      <div className="ml-auto">
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
};

export default UserItemSkeleton;
