import { FreelancerEarningsDashboard } from '@/components/freelancer/FreelancerEarningsDashboard';

export default function FreelancerEarningsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">
          Track your earnings, view payment history, and analyze your income
        </p>
      </div>

      {/* Earnings Dashboard */}
      <FreelancerEarningsDashboard />
    </div>
  );
}
