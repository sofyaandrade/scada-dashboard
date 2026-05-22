import { useContext } from "react";
import { PlcContext } from "@/contexts/PlcContext";

export function usePlc() {
  const ctx = useContext(PlcContext);
  if (!ctx) throw new Error("usePlc deve ser usado dentro de <PlcProvider>");
  return ctx;
}
