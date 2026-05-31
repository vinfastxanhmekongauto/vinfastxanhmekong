'use client';

import { useState } from 'react';
import { Save, Loader2, Info, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AccountSettings() {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const toggleShowPassword = (field: keyof typeof showPassword) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            return;
        }

        setIsSaving(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/admin/account', {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Đổi mật khẩu thất bại.' });
            } else {
                setMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' });
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Lỗi khi đổi mật khẩu:', error);
            setMessage({ type: 'error', text: 'Đã xảy ra lỗi hệ thống.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-vinfast-blue" />
                    Đổi Mật Khẩu
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Cập nhật mật khẩu quản trị viên để bảo mật tài khoản.
                </p>
            </div>

            {message.text && (
                <div className={`m-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className={`h-5 w-5 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`} aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type={showPassword.current ? "text" : "password"}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                className="focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowPassword('current')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type={showPassword.new ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                className="focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowPassword('new')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type={showPassword.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowPassword('confirm')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-5 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-vinfast-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vinfast-blue disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Đang cập nhật...
                            </>
                        ) : (
                            <>
                                <Save className="-ml-1 mr-2 h-4 w-4" /> Cập nhật Mật Khẩu
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
