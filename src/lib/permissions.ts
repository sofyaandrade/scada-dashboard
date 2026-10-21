import type { AuthUser } from "@/types/auth";

export function canManageUsers(user: AuthUser | null): boolean {
  return user?.role?.trim().toUpperCase() === "ADMINISTRADOR";
}

export function canCreateOrDeleteEquipment(user: AuthUser | null): boolean {
  return user?.role?.trim().toUpperCase() === "ADMINISTRADOR";
}
