import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/challenge")({
  component: () => <Outlet />,
});
