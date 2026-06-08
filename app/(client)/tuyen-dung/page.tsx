import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Briefcase, Calendar, MapPin, ArrowRight, Users, GraduationCap, Download } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';

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
};

type Job = {
    id: string;
    title: string;
    slug: string;
    cover_image: string | null;
    header_content: string;
    footer_content: string;
    positions: Position[];
    created_at: string;
    form_url: string;
};

export default async function CareerPage() {
    // Fetch active jobs from Supabase
    const { data: jobsRaw, error } = await supabase
        .from('jobs')
        .select('id, title, slug, cover_image, header_content, footer_content, form_url, positions, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs for public page:', error);
    }

    const jobs = (jobsRaw as Job[]) || [];

    // Parse positions list to check if there are any active positions available
    const activePositions = jobs.flatMap(job => {
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
        return list;
    });

    const hasPositions = activePositions.length > 0;

    const jobPostingsLd = jobs.flatMap(job => {
        let positionsList: Position[] = [];
        if (job.positions) {
            if (Array.isArray(job.positions)) {
                positionsList = job.positions;
            } else if (typeof job.positions === 'string') {
                try {
                    positionsList = JSON.parse(job.positions);
                } catch (e) {
                    console.error('Failed to parse positions string:', e);
                }
            }
        }
        return positionsList.map(pos => {
            const cleanDesc = `Vai trò: ${pos.role || ''}\n\nMô tả công việc:\n${pos.description || ''}\n\nYêu cầu công việc:\n${pos.requirements || ''}`;
            return {
                "@context": "https://schema.org",
                "@type": "JobPosting",
                "title": `${pos.role} - ${job.title}`,
                "description": cleanDesc,
                "datePosted": job.created_at,
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
            {/* Brand Hero Header */}
            {/* <div className="bg-gradient-to-br from-[#00358E] to-[#00205B] text-white py-20 md:py-28 lg:py-32 relative overflow-hidden shadow-md">
                
                <div className="absolute right-0 bottom-0 pointer-events-none select-none opacity-5 translate-y-12 translate-x-12">
                    <span className="text-8xl md:text-[18rem] font-black italic uppercase tracking-tighter">
                        VinFast
                    </span>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-blue-100 border border-white/10 animate-fade-in">
                        <Briefcase size={12} />
                        Chiến dịch tuyển dụng
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase font-display leading-tight drop-shadow-sm">
                        Cơ Hội Nghề Nghiệp
                    </h1>
                    <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base lg:text-lg font-medium leading-relaxed">
                        Đồng hành cùng VinFast Xanh Mekong kiến tạo tương lai di chuyển xanh tại Cần Thơ.
                    </p>
                </div>
            </div> */}

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8 md:py-12">
                {jobs.length === 0 ? (
                    /* Beautifully styled Empty State when no campaigns exist */
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-2xl mx-auto px-6 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 text-vinfast-blue rounded-full flex items-center justify-center mx-auto mb-6">
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
                    /* Jobs List stacked vertically */
                    <div className="space-y-16">
                        {jobs.map((job) => {
                            // Safe parsing fallback for Supabase JSONB
                            let positionsList: Position[] = [];
                            if (job.positions) {
                                if (Array.isArray(job.positions)) {
                                    positionsList = job.positions;
                                } else if (typeof job.positions === 'string') {
                                    try {
                                        positionsList = JSON.parse(job.positions);
                                    } catch (e) {
                                        console.error('Failed to parse positions string:', e);
                                    }
                                }
                            }

                            return (
                                <article
                                    key={job.id}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all duration-350 hover:shadow-md"
                                >
                                    {/* Cover Image Hero Style */}
                                    {job.cover_image && (
                                        <div className="relative w-full aspect-video sm:aspect-[21/9] min-h-[300px] bg-gray-100 border-b border-gray-150 overflow-hidden">
                                            <Image
                                                src={job.cover_image}
                                                alt={job.title}
                                                fill
                                                className="object-cover transition-transform duration-700 hover:scale-105"
                                                priority
                                                unoptimized
                                            />
                                        </div>
                                    )}

                                    {/* Job Details Box */}
                                    <div className="p-6 sm:p-8 md:p-10 space-y-8">
                                        {/* Header Meta Info */}
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    Cập nhật: {new Date(job.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    Khu vực: Cần Thơ
                                                </span>
                                            </div>
                                            <h2 className="text-1xl sm:text-2xl md:text-3xl font-black text-gray-900 font-display uppercase tracking-tight leading-tight">
                                                {job.title}
                                            </h2>
                                            <div className="w-12 h-1 bg-vinfast-blue rounded-full mt-2"></div>
                                        </div>

                                        {/* 1. Header Campaign Content */}
                                        {job.header_content && (
                                            <div className="prose prose-blue max-w-none text-gray-700 text-sm md:text-base leading-relaxed text-justify prose-p:text-gray-650 prose-headings:font-display prose-headings:text-gray-900 prose-headings:font-extrabold prose-strong:text-gray-900">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {job.header_content}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        {/* 2. Positions Listing */}
                                        <div className="space-y-6 pt-4">
                                            <h3 className="text-base font-black text-gray-900 border-l-4 border-vinfast-blue pl-3 uppercase tracking-wider font-display">
                                                Vị Trí Tuyển Dụng Chi Tiết
                                            </h3>
                                            {positionsList && positionsList.length > 0 ? (
                                                <div className="flex flex-col space-y-8">
                                                    {positionsList.map((pos: Position, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 flex flex-col justify-between transition-shadow duration-300 hover:shadow-md"
                                                        >
                                                            <div className="space-y-6">
                                                                {/* Position Name */}
                                                                <h4 className="text-xl font-black text-vinfast-blue uppercase tracking-tight">
                                                                    {pos.role}
                                                                </h4>

                                                                {/* Metadata row with Icons inside CSS Grid */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-gray-600 bg-gray-50/50 border border-gray-100 rounded-xl p-4 shadow-3xs">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <Users size={16} className="text-vinfast-blue shrink-0" />
                                                                        <span>Số lượng: {pos.quantity || 'Không giới hạn'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <GraduationCap size={16} className="text-vinfast-blue shrink-0" />
                                                                        <span>Yêu cầu: {pos.qualification || 'Không yêu cầu'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2.5">
                                                                        <MapPin size={16} className="text-vinfast-blue shrink-0" />
                                                                        <span>Địa điểm: {pos.location || 'Cần Thơ'}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Position description/requirements columns */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                                                                    {pos.description && (
                                                                        <div className="space-y-2">
                                                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Mô tả công việc</span>
                                                                            <div className="prose prose-blue prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed text-justify prose-p:leading-relaxed">
                                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                                    {pos.description}
                                                                                </ReactMarkdown>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {pos.requirements && (
                                                                        <div className="space-y-2">
                                                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Yêu cầu công việc</span>
                                                                            <div className="prose prose-blue prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed text-justify prose-p:leading-relaxed">
                                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                                    {pos.requirements}
                                                                                </ReactMarkdown>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Position CTA button */}
                                                            <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                                                                <Link
                                                                    href={job?.form_url || "#"}
                                                                    target="_blank"
                                                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-vinfast-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-all duration-300 shadow-sm hover:shadow-md uppercase text-[10px] tracking-widest leading-none shrink-0"
                                                                >
                                                                    <span>TẢI MẪU ỨNG TUYỂN</span>
                                                                    <Download size={12} />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-200 shadow-sm px-6">
                                                    <p className="text-gray-600 text-lg font-medium">
                                                        Hiện tại VinFast Xanh Mekong chưa có đợt tuyển dụng mở mới cho vị trí nào. Quý khách vui lòng theo dõi và quay lại sau!
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Footer Campaign Content */}
                                        {job.footer_content && (
                                            <div className="prose prose-blue max-w-none text-gray-700 text-sm md:text-base leading-relaxed text-justify prose-p:text-gray-650 prose-headings:font-display prose-headings:text-gray-900 prose-headings:font-extrabold prose-strong:text-gray-900 pt-4 border-t border-gray-150">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {job.footer_content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
