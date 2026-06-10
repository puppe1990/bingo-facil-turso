import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/event/$eventId')({
  component: EventLayout,
});

function EventLayout() {
  return <Outlet />;
}
