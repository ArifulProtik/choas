import { create } from "zustand";

type titleBarState = {
  title: string;
  setTitle: (title: string) => void;
};

export const useTitleBarStore = create<titleBarState>()((set) => ({
  title: "",
  setTitle: (title: string) => set({ title }),
}));
