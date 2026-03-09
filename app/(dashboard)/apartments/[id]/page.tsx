import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ApartmentCard from '@/components/apartments/ApartmentCard';

export default async function ApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id: idParam } = await params;
  const id = parseInt(idParam);

  if (isNaN(id)) {
    redirect('/apartments');
  }

  return <ApartmentCard apartmentId={id} />;
}
