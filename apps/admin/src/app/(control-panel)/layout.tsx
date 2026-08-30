import MainLayout from '@/components/MainLayout';
import AdminGuard from '@/lib/auth/admin-guard';

export default function ControlPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <MainLayout>{children}</MainLayout>
    </AdminGuard>
  );
}
