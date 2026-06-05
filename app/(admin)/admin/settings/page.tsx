'use client';

import { useState } from 'react';
import AccountSettings from './account-settings';
import SiteSettings from './site-settings';
import { Settings, User, Globe } from 'lucide-react';

export default function SettingsMasterPage() {
    const [activeTab, setActiveTab] = useState<'account' | 'website'>('account');

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
                        <Settings className="w-8 h-8 text-vinfast-blue" />
                        Cài Đặt Hệ Thống
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý tài khoản và các thông số hiển thị của website VinFast Xanh Mekong.
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mb-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`
                            whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'account' 
                                ? 'border-vinfast-blue text-vinfast-blue' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <User className={`mr-2 h-5 w-5 ${activeTab === 'account' ? 'text-vinfast-blue' : 'text-gray-400'}`} />
                        Tài Khoản
                    </button>

                    <button
                        onClick={() => setActiveTab('website')}
                        className={`
                            whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'website' 
                                ? 'border-vinfast-blue text-vinfast-blue' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <Globe className={`mr-2 h-5 w-5 ${activeTab === 'website' ? 'text-vinfast-blue' : 'text-gray-400'}`} />
                        Thông Tin Website
                    </button>
                </nav>
            </div>

            {/* Tab Panels */}
            <div className="mt-6">
                {activeTab === 'account' && <AccountSettings />}
                {activeTab === 'website' && <SiteSettings />}
            </div>
        </div>
    );
}
