import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-500">
          Comprehensive overview of apartments, sales, and financial statistics
        </p>
      </div>
      <DashboardContent />
    </div>
  );
}
