import { cookies } from "next/headers";
import {
  INTERVIEWER_COOKIE,
  sessionIsValid,
} from "@/lib/interviewer-session";
import { requireSessionSecret } from "@/lib/signed-ref";

export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  const cookie = jar.get(INTERVIEWER_COOKIE)?.value;
  try {
    return sessionIsValid(cookie, new Date(), requireSessionSecret());
  } catch (error) {
    console.error("interviewer session check failed", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return false;
  }
}
