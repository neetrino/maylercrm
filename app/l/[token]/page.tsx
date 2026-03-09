import LandingView from '@/components/landing/LandingView';

export default function LandingPage({
  params,
}: {
  params: { token: string };
}) {
  return <LandingView token={params.token} />;
}
