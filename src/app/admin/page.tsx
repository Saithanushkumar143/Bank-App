import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";

export default async function AdminPage() {
  const session = await auth();

  // If not logged in, redirect to login
  if (!session?.user) {
    redirect("/login");
  }

  // If not an admin, redirect to main user dashboard
  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    redirect("/");
  }

  return <AdminDashboard session={session} />;
}
