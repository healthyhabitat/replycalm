import { cookies } from "next/headers";
import { CreateApp } from "@/components/CreateApp";
import { UNLOCK_COOKIE, verifyUnlockToken } from "@/lib/unlock";

export const metadata = {
  title: "Compose — ReplyCalm",
  description:
    "Paste a rough email and get firm, warm, and brief professional replies.",
};

export default async function CreatePage() {
  const jar = await cookies();
  const unlocked = await verifyUnlockToken(jar.get(UNLOCK_COOKIE)?.value);

  return <CreateApp initialUnlocked={unlocked} />;
}
