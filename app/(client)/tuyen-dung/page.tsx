import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Briefcase, Calendar, MapPin, GraduationCap, Award, DollarSign, Clock, Users } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { slugify } from '@/lib/utils';

export const revalidate = 0; // Ensure fresh data on every request

export const metadata: Metadata = {
    title: 'Tuyển Dụng | VinFast Xanh Mekong Cần Thơ',
    description: 'Ứng tuyển ngay các cơ hội việc làm hấp dẫn tại Showroom VinFast Xanh Mekong Cần Thơ. Đang tuyển dụng các vị trí tư vấn bán hàng, kỹ thuật viên...',
    alternates: {
        canonical: '/tuyen-dung',
    },
    openGraph: {
        title: 'Tuyển Dụng | VinFast Xanh Mekong Cần Thơ',
        description: 'Ứng tuyển ngay các cơ hội việc làm hấp dẫn tại Showroom VinFast Xanh Mekong Cần Thơ. Đang tuyển dụng các vị trí tư vấn bán hàng, kỹ thuật viên...',
        url: '/tuyen-dung',
        images: [{ url: '/banner-tuyen-dung.webp' }],
    }
};

type Position = {
    role: string;
    quantity: string;
    qualification: string;
    location: string;
    description: string;
    requirements: string;
    experience?: string;
    salary?: string;
    jobTypes?: string[];
    isUrgent?: boolean;
    deadline?: string;
    benefits?: string | string[];
    thumbnail_url?: string;
    isActive?: boolean;
};

type Job = {
    id: string;
    positions: Position[];
    created_at: string;
};

interface EnrichedPosition extends Position {
    jobId: string;
    positionIndex: number;
}

function JobCard({ pos, jobId, index }: { pos: EnrichedPosition; jobId: string; index: number }) {
    const detailUrl = `/tuyen-dung/${slugify(pos.role)}`;
    const displayTypes = pos.jobTypes || ["Toàn thời gian"];
    
    return (
        <Link 
            href={detailUrl}
            className="group bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col justify-between transition-all duration-350 hover:-translate-y-1.5 hover:shadow-lg hover:border-blue-200"
        >
            <div className="relative">
                {/* Header Image */}
                <div className="relative w-full aspect-video md:aspect-[16/10] bg-gray-100 overflow-hidden border-b border-gray-100">
                    <Image
                        src={pos.thumbnail_url || "/banner-tuyen-dung.webp"}
                        alt={pos.role}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={index < 3}
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                {/* Overlapping Tags */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                    {pos.isUrgent && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                            Tuyển gấp
                        </span>
                    )}
                    {displayTypes.map((type, i) => (
                        <span 
                            key={i} 
                            className="bg-white/95 text-blue-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-gray-100"
                        >
                            {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors uppercase font-display line-clamp-2">
                        {pos.role}
                    </h3>
                    <div className="w-8 h-0.5 bg-blue-600 rounded-full"></div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-2.5 py-2.5 text-sm font-medium text-slate-700 border-t border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-blue-600 shrink-0" />
                        <span className="truncate">{pos.location || "Cần Thơ"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={15} className="text-blue-600 shrink-0" />
                        <span className="truncate">Số lượng: {pos.quantity || "Đang cập nhật"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <GraduationCap size={15} className="text-blue-600 shrink-0" />
                        <span className="truncate">Kinh nghiệm: {pos.experience || "Không yêu cầu"}</span>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mức lương</span>
                        <span className="text-sm font-bold text-blue-700 font-display">{pos.salary || "Thỏa thuận"}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạn nộp</span>
                        <span className="text-sm font-medium text-slate-700">{pos.deadline || "15/07/2026"}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default async function CareerPage() {
    // Fetch active jobs from Supabase
    const { data: jobsRaw, error } = await supabase
        .from('jobs')
        .select('id, positions, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs for public page:', error);
    }

    const jobs = (jobsRaw as Job[]) || [];

    // Parse positions list to check if there are any active positions available
    const activePositions: EnrichedPosition[] = jobs.flatMap(job => {
        let list: Position[] = [];
        if (job.positions) {
            if (Array.isArray(job.positions)) {
                list = job.positions;
            } else if (typeof job.positions === 'string') {
                try {
                    list = JSON.parse(job.positions);
                } catch (e) {
                    console.error('Failed to parse positions:', e);
                }
            }
        }
        return list
            .filter(pos => pos.isActive !== false)
            .map((pos, index) => ({
                ...pos,
                jobId: job.id,
                positionIndex: index
            }));
    });

    const totalPositions = activePositions.length || 0;

    const jobPostingsLd = activePositions.map(pos => {
        const cleanDesc = `Vai trò: ${pos.role || ''}\n\nMô tả công việc:\n${pos.description || ''}\n\nYêu cầu công việc:\n${pos.requirements || ''}`;
        return {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": pos.role,
            "description": cleanDesc,
            "datePosted": new Date().toISOString(),
            "employmentType": "FULL_TIME",
            "hiringOrganization": {
                "@type": "Organization",
                "name": "VinFast Xanh Mekong",
                "sameAs": SITE_URL
            },
            "jobLocation": {
                "@type": "Place",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": pos.location || "Cần Thơ",
                    "addressCountry": "VN"
                }
            }
        };
    });

    return (
        <>
            {jobPostingsLd.map((jsonLd, idx) => (
                <script
                    key={idx}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            ))}
            <div className="bg-gray-50 min-h-screen">
                <div className="bg-[#0a1128] text-white pt-16 pb-24 md:pt-20 md:pb-32 lg:pt-24 lg:pb-36 relative overflow-hidden shadow-md">
                    {/* Logo Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
                        <img src="/logo-vinfast.svg" alt="VinFast Logo Watermark" className="w-3/4 md:w-1/2 object-contain" />
                    </div>

                    {/* Bottom-Right Watermark */}
                    <div className="absolute -bottom-10 -right-10 pointer-events-none opacity-[0.03] md:opacity-5 select-none z-0">
                        <span className="text-[8rem] md:text-[15rem] font-black uppercase leading-none tracking-tighter">
                            VINFAST
                        </span>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-blue-100 border border-white/10 animate-fade-in">
                            <Briefcase size={12} />
                            Đang tuyển {totalPositions} vị trí
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight uppercase font-display leading-tight drop-shadow-sm">
                            Cơ Hội Nghề Nghiệp
                        </h1>
                        <p className="text-blue-100 max-w-3xl mx-auto text-sm md:text-base lg:text-lg font-medium leading-relaxed">
                            Đồng hành cùng VinFast Xanh Mekong kiến tạo tương lai di chuyển xanh tại Cần Thơ.
                        </p>
                    </div>
                </div>

                {/* 3 Feature Boxes */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-20 relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                <Briefcase size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-900 text-base uppercase tracking-tight">Môi trường chuyên nghiệp</h3>
                                <p className="text-gray-600 text-[15px] md:text-base font-normal leading-relaxed">Làm việc trong môi trường năng động, thân thiện và đề cao tính sáng tạo.</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                <GraduationCap size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-900 text-base uppercase tracking-tight">Đào tạo bài bản</h3>
                                <p className="text-gray-600 text-[15px] md:text-base font-normal leading-relaxed">Được hướng dẫn và tham gia các khóa đào tạo nghiệp vụ chuẩn VinFast.</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                <Award size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-900 text-base uppercase tracking-tight">Chế độ đãi ngộ</h3>
                                <p className="text-gray-600 text-[15px] md:text-base font-normal leading-relaxed">Chế độ lương thưởng hấp dẫn, xứng đáng năng lực và đầy đủ bảo hiểm.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-16 md:py-20">
                    <div className="text-center mb-10 max-w-2xl mx-auto space-y-3">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase font-display tracking-tight">
                            Các Vị Trí Đang Tuyển Dụng
                        </h2>
                        <p className="text-gray-700 text-base md:text-lg font-normal leading-relaxed">
                            Hãy gia nhập đội ngũ VinFast Xanh Mekong để cùng bứt phá giới hạn bản thân và phát triển sự nghiệp bền vững.
                        </p>
                    </div>

                    {activePositions.length === 0 ? (
                        /* Beautifully styled Empty State when no campaigns exist */
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-2xl mx-auto px-6 shadow-sm">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
                                Hiện tại VinFast Xanh Mekong chưa có đợt tuyển dụng mở mới cho vị trí nào.
                            </h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                                Quý khách vui lòng theo dõi và quay lại sau!
                            </p>
                        </div>
                    ) : (
                        /* Job Listing Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activePositions.map((pos, idx) => (
                                <JobCard 
                                    key={idx} 
                                    pos={pos} 
                                    jobId={pos.jobId} 
                                    index={pos.positionIndex} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
