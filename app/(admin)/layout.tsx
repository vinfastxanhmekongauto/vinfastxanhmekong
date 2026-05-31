import Link from 'next/link';
import LogoutButton from '@/components/admin/logout-button';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-utils';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const adminSession = await verifyToken(token);

    if (!adminSession) {
        // Render simple layout without sidebar/header for unauthenticated users (like /admin/login)
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar fixed */}
            <aside className="w-64 bg-vinfast-blue text-vinfast-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 text-2xl font-bold tracking-wider">
                    VINFAST ADMIN
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin/dashboard" className="block px-4 py-2 hover:bg-blue-800 rounded">
                        Dashboard
                    </Link>
                    <Link href="/admin/products" className="block px-4 py-2 hover:bg-blue-800 rounded">
                        Sản phẩm
                    </Link>
                    <Link href="/admin/promotions" className="block px-4 py-2 hover:bg-blue-800 rounded">
                        Khuyến mãi
                    </Link>
                    {/* <Link href="/admin/leads" className="block px-4 py-2 hover:bg-blue-800 rounded">
                        Khách hàng (Leads)
                    </Link> */}
                    <Link href="/admin/settings" className="block px-4 py-2 hover:bg-blue-800 rounded">
                        Cài đặt
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b flex items-center justify-between px-6">
                    <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                        <span>{adminSession.username}</span>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <LogoutButton />
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-6 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
