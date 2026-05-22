import { createFileRoute } from "@tanstack/react-router";
import { PlcDetailPage } from "@/pages/PlcDetailPage";

export const Route = createFileRoute("/_app/plcs/$plcId")({
  component: PlcDetailRoute,
});

function PlcDetailRoute() {
  const { plcId } = Route.useParams();
  return <PlcDetailPage plcId={plcId} />;
}
