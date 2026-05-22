import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function HomePage() {
  const { accessToken, user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    navigate({ to: user && accessToken ? "/dashboard" : "/login" });
  }, [accessToken, ready, user, navigate]);
  return null;
}
