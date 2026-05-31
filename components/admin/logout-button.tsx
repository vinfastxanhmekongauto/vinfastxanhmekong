'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                router.push('/admin/login');
                router.refresh(); // Force a refresh to clear layout cache
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors"
        >
            <LogOut size={16} /> Thoát
        </button>
    );
}
