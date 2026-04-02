import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopNavbar } from './TopNavbar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
