import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BiteBolt Admin',
  description: 'BiteBolt Order Management Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Providers>
          <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-orange-600">🍔 BiteBolt</h1>
                <p className="text-xs text-gray-500 mt-0.5">Admin Dashboard</p>
              </div>
              <nav className="flex-1 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  Orders
                </p>
                <SidebarLink href="/orders" label="📦 All Orders" />
                <SidebarLink href="/orders?status=PENDING" label="🟡 Pending" />
                <SidebarLink href="/orders?status=PREPARING" label="🔵 Preparing" />
                <SidebarLink href="/orders?status=OUT_FOR_DELIVERY" label="🟠 Out for Delivery" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-4 mb-2">
                  Menu
                </p>
                <SidebarLink href="/foods" label="🍽️ Food Items" />
              </nav>
            </aside>
            {/* Main */}
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors mb-1"
    >
      {label}
    </a>
  );
}
