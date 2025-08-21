// src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const hasSession = !!cookies().get("session")?.value;
  redirect(hasSession ? "/ws/p1" : "/login");
}
