'use client';

import { useState } from 'react';
import ServiceSettings from '../settings/service-settings';
import GiftManager from './gift-manager';
import { Wrench, HeartHandshake, Gift } from 'lucide-react';

export default function AdminServicesPage() {
    const [activeTab, setActiveTab] = useState<'booking' | 'care' | 'gifts'>('booking');

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
                        <Wrench className="w-8 h-8 text-vinfast-blue" />
                        Quản Lý Dịch Vụ
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các module dịch vụ xe VinFast, chăm sóc khách hàng và quà tặng.
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mb-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('booking')}
                        className={`
                            whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'booking' 
                                ? 'border-vinfast-blue text-vinfast-blue' 
                                : 'border-transparent text-gray-550 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <Wrench className={`mr-2 h-5 w-5 ${activeTab === 'booking' ? 'text-vinfast-blue' : 'text-gray-400'}`} />
                        Đặt lịch dịch vụ
                    </button>

                    <button
                        onClick={() => setActiveTab('care')}
                        className={`
                            whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'care' 
                                ? 'border-vinfast-blue text-vinfast-blue' 
                                : 'border-transparent text-gray-550 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <HeartHandshake className={`mr-2 h-5 w-5 ${activeTab === 'care' ? 'text-vinfast-blue' : 'text-gray-400'}`} />
                        Chăm sóc khách hàng
                    </button>

                    <button
                        onClick={() => setActiveTab('gifts')}
                        className={`
                            whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                            ${activeTab === 'gifts' 
                                ? 'border-vinfast-blue text-vinfast-blue' 
                                : 'border-transparent text-gray-550 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        <Gift className={`mr-2 h-5 w-5 ${activeTab === 'gifts' ? 'text-vinfast-blue' : 'text-gray-400'}`} />
                        Quà tặng VinFast
                    </button>
                </nav>
            </div>

            {/* Tab Panels */}
            <div className="mt-6">
                {activeTab === 'booking' && (
                    <ServiceSettings type="booking" title="Cấu Hinh Đặt Lịch Dịch Vụ" />
                )}
                {activeTab === 'care' && (
                    <ServiceSettings type="care" title="Cấu Hinh Chăm Sóc Khách Hàng" />
                )}
                {activeTab === 'gifts' && (
                    <div className="space-y-8">
                        <ServiceSettings type="gifts" title="Cấu Hình Banner & SEO Quà Tặng" />
                        <GiftManager />
                    </div>
                )}
            </div>
        </div>
    );
}
