import LandingView from '@/components/landing/LandingView';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <LandingView token={token} />;
}
