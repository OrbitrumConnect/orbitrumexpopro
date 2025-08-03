import CleanProfessionalDashboard from "./CleanProfessionalDashboard";

interface ProfessionalDashboardProps {
  user: any;
}

export function ProfessionalDashboard({ user }: ProfessionalDashboardProps) {
  return <CleanProfessionalDashboard user={user} />;
}

export default ProfessionalDashboard;