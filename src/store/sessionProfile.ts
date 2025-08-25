// src/store/sessionProfile.ts
"use client";
import { create } from "zustand";

export type SessionProfile = {
  name: string;
  nickname: string;
  email: string;
  theme: "light" | "dark";
};

type S = {
  profile: SessionProfile;
  setField: (k: keyof SessionProfile, v: string | "light" | "dark") => void;
  reset: () => void;
};

const DEFAULT: SessionProfile = {
  name: "",
  nickname: "",
  email: "",
  theme: "light",
};

export const useSessionProfile = create<S>((set) => ({
  profile: { ...DEFAULT },
  setField: (k, v) => set((s) => ({ profile: { ...s.profile, [k]: v as any } })),
  reset: () => set({ profile: { ...DEFAULT } }),
}));
