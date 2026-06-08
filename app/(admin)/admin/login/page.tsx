'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    setIsBlocked(true);
                }
                throw new Error(data.error || 'Đăng nhập thất bại.');
            }

            // Success
            if (data.needsPasswordChange) {
                // If the user's password in DB is plaintext, force them to change it
                alert('CHÚ Ý: Mật khẩu của bạn hiện đang không an toàn. Bạn sẽ được chuyển hướng để đổi mật khẩu ngay lập tức!');
                router.push('/admin/settings');
            } else {
                router.push('/admin/dashboard');
            }
            router.refresh(); // Refresh session layout
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-vinfast-gray px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-vinfast-blue p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative w-20 h-20 mb-4 bg-white rounded-full p-2 flex items-center justify-center shadow-inner">
                        <Lock className="w-10 h-10 text-vinfast-blue" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wider">Hệ Thống Quản Trị</h1>
                    <p className="text-blue-100 text-sm mt-2">VinFast Xanh Mekong</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className={`p-4 mb-6 rounded-lg flex items-start gap-3 text-sm ${isBlocked ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-orange-50 text-orange-800 border border-orange-200'}`}>
                            <AlertTriangle className={`w-5 h-5 shrink-0 ${isBlocked ? 'text-red-500' : 'text-orange-500'}`} />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Quản trị (Hoặc Username)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all"
                                    placeholder="admin@vinfastmekong.com"
                                    disabled={loading || isBlocked} // If blocked practically, disable further inputs for UX (optional)
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all"
                                    placeholder="••••••••"
                                    disabled={loading || isBlocked}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isBlocked}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-md ${isBlocked
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-vinfast-blue hover:bg-blue-800'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xác thực...
                                </>
                            ) : isBlocked ? (
                                'Đã bị khóa tạm thời'
                            ) : (
                                'Đăng Nhập'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <p className="mt-8 text-sm text-gray-500">
                &copy; {new Date().getFullYear()} VinFast Xanh Mekong. Hệ thống được bảo vệ nhiều lớp.
            </p>
        </div>
    );
}
