import { auth } from '@/auth';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/layout/LogoutButton';
import SidebarNav from '@/components/layout/SidebarNav';

const LOGO_URL =
  'https://pub-02e4900b528c4215ba0bfc3cf1e9934e.r2.dev/meluvis-logo.svg';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'ADMIN';

  const navItems = [
    { href: '/apartments', label: 'Apartments', iconName: 'Home' },
    ...(isAdmin
      ? [
          { href: '/admin/buildings', label: 'Buildings', iconName: 'Building2' },
          { href: '/admin/districts', label: 'Districts', iconName: 'MapPin' },
        ]
      : []),
    { href: '/dashboard', label: 'Analytics', iconName: 'LayoutDashboard' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-gray-200 px-4">
            <Image
              src={LOGO_URL}
              alt="Meluvis CRM"
              width={160}
              height={56}
              className="h-10 w-auto object-contain object-left brightness-0"
              priority
              unoptimized
            />
          </div>

          {/* Navigation */}
          <SidebarNav navItems={navItems} />

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="text-xs font-medium text-gray-500">Logged in as</p>
              <p className="text-sm font-semibold text-gray-900">{session.user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{session.user.role.toLowerCase()}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content — wide workspace */}
      <div className="ml-64 min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[1600px] px-6 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
