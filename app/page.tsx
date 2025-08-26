import { getUser } from "@/actions/get-user";
import { redirect } from "next/navigation";

export default async function Home() {
  const userRes = await getUser();

  if (!userRes.success) {
    redirect("/login");
  }

  if (userRes.data) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
