import { SummaryBar } from '@/components/dashboard/SummaryBar';
import { AllocationChart } from '@/components/dashboard/AllocationChart';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';

export function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Overview</h2>
      <SummaryBar />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AllocationChart />
        {/* Placeholder slot — performance chart will go here in a future session */}
        <div className="rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm h-[340px]">
          Performance chart — coming soon
        </div>
      </div>
      <HoldingsTable />
    </div>
  );
}
