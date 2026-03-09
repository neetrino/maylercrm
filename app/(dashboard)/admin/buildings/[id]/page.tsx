import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BuildingEditPage from '@/components/buildings/BuildingEditPage';

export default async function BuildingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/apartments');
  }

  const numId = parseInt(params.id, 10);
  if (isNaN(numId)) {
    redirect('/admin/buildings');
  }

  return <BuildingEditPage buildingId={numId} />;
}
