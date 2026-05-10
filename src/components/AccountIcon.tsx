import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AccountIcon() {
  const { user } = useAuth();
  return (
    <Link
      to={user ? "/orders" : "/auth"}
      className="grid place-items-center w-10 h-10 rounded-full bg-white text-primary hover:scale-105 transition-transform"
      aria-label={user ? "My orders" : "Login"}
      title={user ? "My orders" : "Login"}
    >
      <User className="w-4 h-4" />
    </Link>
  );
}
