import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BuildingEditPage from '@/components/buildings/BuildingEditPage';

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/apartments');
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    redirect('/admin/buildings');
  }

  return <BuildingEditPage buildingId={numId} />;
}
