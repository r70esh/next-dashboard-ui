import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const Homepage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  const role = (session.user as any)?.role;

  if (role === "admin") redirect("/admin");
  else if (role === "teacher") redirect("/teacher");
  else if (role === "student") redirect("/student");
  else if (role === "parent") redirect("/parent");
  else redirect("/sign-in");
};

export default Homepage;