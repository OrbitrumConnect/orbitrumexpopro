import CleanClientDashboard from "./CleanClientDashboard";

interface ClientDashboardProps {
  user: any;
}

export function ClientDashboard({ user }: ClientDashboardProps) {
  return <CleanClientDashboard user={user} />;
}

export default ClientDashboard;