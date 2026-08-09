import { createFileRoute } from "@tanstack/react-router";
import { PlcDetailPage } from "@/pages/PlcDetailPage";

export const Route = createFileRoute("/_app/clps/$plcId")({
  component: ClpDetailRoute,
});

function ClpDetailRoute() {
  const { plcId } = Route.useParams();
  return <PlcDetailPage plcId={plcId} />;
}
