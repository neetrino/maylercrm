import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BuildingNewPage from '@/components/buildings/BuildingNewPage';

export default async function BuildingNewPageRoute() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/apartments');
  }

  return <BuildingNewPage />;
}
