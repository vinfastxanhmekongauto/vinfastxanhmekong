import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Briefcase, Calendar, MapPin, GraduationCap, Download, Phone, Mail, CheckCircle, Info, DollarSign, Users } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { slugify } from '@/lib/utils';

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
    hr_hotline?: string;
    hr_email?: string;
    application_form_url?: string;
    required_documents?: string;
    submission_note?: string;
    submission_address?: string;
};

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    
    const fallbackTitle = 'Chi Tiết Tuyển Dụng | VinFast Xanh Mekong Cần Thơ';
    const fallbackDesc = 'Khám phá các vị trí tuyển dụng hấp dẫn tại Showroom VinFast Xanh Mekong Cần Thơ. Xem chi tiết các cơ hội việc làm và nộp hồ sơ ứng tuyển ngay.';
    const fallbackImage = `${SITE_URL}/banner-tuyen-dung.webp`;

    try {
        const { data: jobsRaw } = await supabase
            .from('jobs')
            .select('positions')
            .eq('is_active', true);

        if (jobsRaw) {
            for (const job of jobsRaw) {
                let positions: Position[] = [];
                if (job.positions) {
                    if (Array.isArray(job.positions)) {
                        positions = job.positions;
                    } else if (typeof job.positions === 'string') {
                        try {
                            positions = JSON.parse(job.positions);
                        } catch (e) { }
                    }
                }
                const pos = positions.filter(p => p.isActive !== false).find(p => slugify(p.role) === resolvedParams.id);
                if (pos) {
                    const description = `Ứng tuyển ngay vị trí ${pos.role} tại VinFast Xanh Mekong Cần Thơ. Mức lương: ${pos.salary || 'Thỏa thuận'}, Số lượng: ${pos.quantity || 'Đang cập nhật'}, Kinh nghiệm: ${pos.experience || 'Không yêu cầu'}. Hạn nộp: ${pos.deadline || 'Đang cập nhật'}. Xem chi tiết và nộp hồ sơ!`;

                    const imageUrl = pos.thumbnail_url
                        ? (pos.thumbnail_url.startsWith('http') ? pos.thumbnail_url : `${SITE_URL}${pos.thumbnail_url}`)
                        : fallbackImage;

                    const pageTitle = `Tuyển dụng ${pos.role} | VinFast Xanh Mekong`;

                    return {
                        title: pageTitle,
                        description,
                        alternates: {
                            canonical: `${SITE_URL}/tuyen-dung/${resolvedParams.id}`,
                        },
                        openGraph: {
                            title: pageTitle,
                            description,
                            url: `${SITE_URL}/tuyen-dung/${resolvedParams.id}`,
                            images: [{ url: imageUrl }],
                            type: 'article',
                        },
                        twitter: {
                            card: 'summary_large_image',
                            title: pageTitle,
                            description,
                            images: [imageUrl],
                        }
                    };
                }
            }
        }
    } catch (e) {
        console.error('Error generating page metadata:', e);
    }

    return {
        title: fallbackTitle,
        description: fallbackDesc,
        alternates: {
            canonical: `${SITE_URL}/tuyen-dung`,
        },
        openGraph: {
            title: fallbackTitle,
            description: fallbackDesc,
            url: `${SITE_URL}/tuyen-dung`,
            images: [{ url: fallbackImage }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: fallbackTitle,
            description: fallbackDesc,
            images: [fallbackImage],
        }
    };
}

const defaultRequiredDocuments = `- Đơn xin việc / CV cá nhân.
- Sơ yếu lý lịch (có xác nhận của địa phương).
- Bản sao CMND/CCCD (không cần công chứng).
- Bản sao các văn bằng, chứng chỉ liên quan.
- Giấy khám sức khỏe (trong vòng 6 tháng).`;

export default async function JobDetailPage({ params }: Props) {
    const resolvedParams = await params;

    // Fetch all active jobs
    const { data: jobsRaw, error } = await supabase
        .from('jobs')
        .select('id, positions, required_documents, application_form_url, hr_hotline, hr_email, submission_note, submission_address, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    const jobs = (jobsRaw as Job[]) || [];
    let matchedPos: Position | null = null;
    let matchedJob: Job | null = null;

    for (const job of jobs) {
        let positions: Position[] = [];
        if (job.positions) {
            if (Array.isArray(job.positions)) {
                positions = job.positions;
            } else if (typeof job.positions === 'string') {
                try {
                    positions = JSON.parse(job.positions);
                } catch (e) {
                    console.error('Failed to parse positions array:', e);
                }
            }
        }
        const pos = positions.filter(p => p.isActive !== false).find(p => slugify(p.role) === resolvedParams.id);
        if (pos) {
            matchedPos = pos;
            matchedJob = job;
            break;
        }
    }

    if (error || !matchedPos || !matchedJob) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4">
                <div className="text-center bg-white border border-gray-200 p-8 rounded-2xl max-w-md shadow-sm">
                    <Info className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy vị trí tuyển dụng</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Tin tuyển dụng có thể đã hết hạn hoặc không tồn tại. Vui lòng quay lại danh sách chính.
                    </p>
                    <Link
                        href="/tuyen-dung"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-wider"
                    >
                        Quay lại Danh Sách
                    </Link>
                </div>
            </div>
        );
    }

    const pos = matchedPos;
    const job = matchedJob;

    const displayTypes = pos.jobTypes || ["Toàn thời gian"];
    const benefitsList = Array.isArray(pos.benefits)
        ? pos.benefits
        : (typeof pos.benefits === 'string' ? [pos.benefits] : []);

    const cleanDescription = pos.description ? pos.description.replace(/\t/g, ' ') : '';
    const cleanRequirements = pos.requirements ? pos.requirements.replace(/\t/g, ' ') : '';

    const parseDeadline = (deadlineStr?: string): string | undefined => {
        if (!deadlineStr) return undefined;
        const match = deadlineStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;
        const isoMatch = deadlineStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) return deadlineStr;
        try {
            const date = new Date(deadlineStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {}
        return undefined;
    };

    const getEmploymentType = (jobTypes?: string[]): string | string[] => {
        if (!jobTypes || jobTypes.length === 0) return "FULL_TIME";
        const mapped = jobTypes.map(t => {
            const lower = t.toLowerCase();
            if (lower.includes("toàn thời gian") || lower.includes("full")) return "FULL_TIME";
            if (lower.includes("bán thời gian") || lower.includes("part")) return "PART_TIME";
            if (lower.includes("thực tập") || lower.includes("intern")) return "INTERN";
            if (lower.includes("hợp đồng") || lower.includes("contract")) return "CONTRACTOR";
            return "FULL_TIME";
        });
        return mapped.length === 1 ? mapped[0] : mapped;
    };

    const parseSalary = (salaryStr?: string) => {
        if (!salaryStr || salaryStr.toLowerCase().includes("thỏa thuận")) return undefined;
        const numbers = salaryStr.match(/\d+/g);
        if (!numbers || numbers.length === 0) return undefined;
        const multiplier = salaryStr.toLowerCase().includes("triệu") ? 1000000 : 1;
        if (numbers.length === 1) {
            const val = parseInt(numbers[0]) * multiplier;
            return {
                "@type": "MonetaryAmount",
                "currency": "VND",
                "value": {
                    "@type": "QuantitativeValue",
                    "value": val,
                    "unitText": "MONTH"
                }
            };
        } else if (numbers.length >= 2) {
            const minVal = parseInt(numbers[0]) * multiplier;
            const maxVal = parseInt(numbers[1]) * multiplier;
            return {
                "@type": "MonetaryAmount",
                "currency": "VND",
                "value": {
                    "@type": "QuantitativeValue",
                    "minValue": minVal,
                    "maxValue": maxVal,
                    "unitText": "MONTH"
                }
            };
        }
        return undefined;
    };

    const descriptionHtml = [
        pos.description ? `<p><strong>Mô tả công việc:</strong></p><p>${pos.description.replace(/\n/g, '<br/>')}</p>` : '',
        pos.requirements ? `<p><strong>Yêu cầu công việc:</strong></p><p>${pos.requirements.replace(/\n/g, '<br/>')}</p>` : '',
        benefitsList.length > 0 ? `<p><strong>Quyền lợi được hưởng:</strong></p><ul>${benefitsList.map(b => `<li>${b}</li>`).join('')}</ul>` : ''
    ].filter(Boolean).join('');

    const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": pos.role,
        "description": descriptionHtml,
        "datePosted": new Date(job.created_at || Date.now()).toISOString().split('T')[0],
        "validThrough": parseDeadline(pos.deadline),
        "employmentType": getEmploymentType(pos.jobTypes),
        "hiringOrganization": {
            "@type": "Organization",
            "name": "VinFast Xanh Mekong",
            "sameAs": "https://www.vinfastmekong.vn",
            "logo": "https://csuojiptwnfjnvfmwzhy.supabase.co/storage/v1/object/public/images/logo.png"
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": pos.location || "Số 10362, đường Võ Nguyên Giáp, P.Hưng Phú",
                "addressLocality": "Cần Thơ",
                "addressRegion": "Đồng bằng Sông Cửu Long",
                "addressCountry": "VN"
            }
        },
        ...(parseSalary(pos.salary) ? { "baseSalary": parseSalary(pos.salary) } : {})
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
            {/* Google Jobs Schema (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
            />
            {/* 1. Detail Hero */}
            <div className="bg-[#0a1128] text-white pt-16 pb-20 md:pt-20 md:pb-24 relative overflow-hidden shadow-md">
                {/* Background watermarks */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
                    <img src="/logo-vinfast.svg" alt="VinFast Logo Watermark" className="w-3/4 md:w-1/2 object-contain" />
                </div>
                <div className="absolute -bottom-10 -right-10 pointer-events-none opacity-[0.03] md:opacity-5 select-none z-0">
                    <span className="text-[8rem] md:text-[15rem] font-black uppercase leading-none tracking-tighter">
                        VINFAST
                    </span>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Hero Text */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex flex-wrap gap-2">
                                {pos.isUrgent && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                                        Tuyển gấp
                                    </span>
                                )}
                                {displayTypes.map((type, i) => (
                                    <span key={i} className="bg-white/10 text-blue-100 text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                                        {type}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight font-display leading-tight">
                                {pos.role}
                            </h1>

                            <p className="text-gray-300 text-sm md:text-base font-medium max-w-xl">
                                Cơ hội nghề nghiệp tuyệt vời tại VinFast Xanh Mekong — Showroom xe điện hàng đầu tại khu vực Cần Thơ.
                            </p>

                            {/* Info pills */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs md:text-sm font-medium text-blue-100">
                                    <Users size={16} className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span>Số lượng: {pos.quantity || "Đang cập nhật"}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs md:text-sm font-medium text-blue-100">
                                    <GraduationCap size={16} className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span>Bằng cấp: {pos.qualification || "Không yêu cầu"}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs md:text-sm font-medium text-blue-100">
                                    <Briefcase size={16} className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span>Kinh nghiệm: {pos.experience || "Không yêu cầu"}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs md:text-sm font-medium text-blue-100">
                                    <DollarSign size={16} className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="font-bold text-blue-300">Lương: {pos.salary || "Thỏa thuận"}</span>
                                </div>
                            </div>

                            {/* Button actions */}
                            <div className="flex flex-wrap gap-4 pt-4">
                                <a
                                    href={`mailto:${job.hr_email || 'vfxanhmekong@gmail.com'}?subject=Ứng tuyển vị trí ${pos.role}`}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm uppercase tracking-wider text-xs md:text-sm"
                                >
                                    Ứng tuyển ngay
                                </a>
                                <a
                                    href={`tel:${(job.hr_hotline || '0907697036').replace(/\s+/g, '')}`}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-lg transition-all uppercase tracking-wider text-xs md:text-sm"
                                >
                                    Liên hệ trực tiếp
                                </a>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="lg:col-span-5 hidden lg:block">
                            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-lg bg-gray-900">
                                <Image
                                    src={pos.thumbnail_url || "/banner-tuyen-dung.webp"}
                                    alt={pos.role}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Detail Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Mô tả công việc */}
                        {pos.description && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-3xs space-y-2">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight border-l-4 border-blue-600 pl-3 font-display">
                                    Mô tả công việc
                                </h3>
                                <div className="text-gray-700 text-sm md:text-base text-justify">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            ul: ({ node, ...props }: any) => <ul className="list-disc list-outside space-y-1 ml-5 text-gray-700" {...props} />,
                                            li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
                                            p: ({ node, ...props }: any) => <p className="inline" {...props} />
                                        }}
                                    >
                                        {cleanDescription}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Yêu cầu tuyển dụng */}
                        {pos.requirements && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-3xs space-y-2">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight border-l-4 border-blue-600 pl-3 font-display">
                                    Yêu cầu tuyển dụng
                                </h3>
                                <div className="text-gray-700 text-sm md:text-base text-justify">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            ul: ({ node, ...props }: any) => <ul className="list-disc list-outside space-y-1 ml-5 text-gray-700" {...props} />,
                                            li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
                                            p: ({ node, ...props }: any) => <p className="inline" {...props} />
                                        }}
                                    >
                                        {cleanRequirements}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Quyền lợi & Phúc lợi */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-3xs space-y-2">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight border-l-4 border-blue-600 pl-3 font-display">
                                Quyền lợi & Phúc lợi
                            </h3>
                            {benefitsList.length > 0 ? (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 pt-1.5">
                                    {benefitsList.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-100 py-2.5 px-4 rounded-xl shadow-3xs">
                                            <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                                            <span className="text-gray-700 text-sm leading-snug font-medium">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Chi tiết quyền lợi sẽ trao đổi trực tiếp trong quá trình phỏng vấn.
                                </div>
                            )}
                        </div>

                        {/* HỒ SƠ ỨNG TUYỂN & CÁCH THỨC NỘP */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-3xs space-y-2">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight border-l-4 border-blue-600 pl-3 font-display">
                                HỒ SƠ ỨNG TUYỂN & CÁCH THỨC NỘP
                            </h3>
                            <div className="pt-2 text-slate-700 text-sm md:text-base text-justify">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-5 space-y-1 text-gray-700" {...props} />,
                                        li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
                                        p: ({ node, ...props }: any) => <p className="inline" {...props} />
                                    }}
                                >
                                    {job.required_documents || defaultRequiredDocuments}
                                </ReactMarkdown>
                            </div>

                            {job.submission_note && (
                                <span className="mt-6 pt-4 font-bold border-t border-gray-200 text-blue-900  mt-4 block text-lg">
                                    {job.submission_note}
                                </span>
                            )}

                            <div className="space-y-3  text-sm">
                                {job.submission_address && (
                                    <div className="flex items-start gap-3 text-sm md:text-base">
                                        <MapPin size={20} className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="flex-1 text-gray-700">
                                            <span className="font-semibold text-gray-900">Nộp trực tiếp: </span>
                                            {job.submission_address?.split(/<\/?br\s*\/?>/i).map((line, index, array) => (
                                                <span key={index}>
                                                    {line}
                                                    {index !== array.length - 1 && <br />}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {job.hr_email && (
                                    <div className="flex items-start gap-3 text-sm md:text-base">
                                        <Mail size={20} className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="flex-1 text-gray-700">
                                            <span className="font-semibold text-gray-900">Nộp online: </span>
                                            <a href={`mailto:${job.hr_email}`} className="text-blue-600 hover:underline">{job.hr_email}</a>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3 text-sm md:text-base">
                                    <Calendar size={20} className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="flex flex-1 items-center justify-start">
                                        <span className="font-semibold text-gray-900">Hạn nhận hồ sơ:</span>
                                        <span className="inline-flex items-center rounded-md bg-red-50 mx-2 px-2.5 py-1 text-sm font-bold text-red-700 ring-1 ring-inset ring-red-600/10">
                                            {pos.deadline || "Đang cập nhật"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="sticky top-24 space-y-6">
                        {/* Ứng tuyển ngay Card */}
                        <div className="bg-[#0a1128] text-white rounded-2xl p-6 shadow-md border border-white/10 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold tracking-tight font-display uppercase text-blue-300">
                                    Hỗ trợ ứng tuyển
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Tải mẫu hồ sơ và liên hệ trực tiếp với bộ phận nhân sự của VinFast Xanh Mekong để bắt đầu cơ hội của bạn.
                                </p>
                            </div>

                            <Link
                                href={job.application_form_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-lg shadow-sm block transition-all uppercase tracking-wider text-xs"
                            >
                                Tải mẫu hồ sơ
                            </Link>

                            <div className="h-[1px] bg-white/10 my-4"></div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-blue-400">
                                        <Phone size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Hotline tuyển dụng</span>
                                        <a
                                            href={`tel:${(job.hr_hotline || '0907697036').replace(/\s+/g, '')}`}
                                            className="text-sm font-bold hover:text-blue-400 transition-colors"
                                        >
                                            {job.hr_hotline || '0907 697 036'}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-blue-400">
                                        <Mail size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Email ứng tuyển</span>
                                        <a
                                            href={`mailto:${job.hr_email || 'vfxanhmekong@gmail.com'}`}
                                            className="text-sm font-bold hover:text-blue-400 transition-colors"
                                        >
                                            {job.hr_email || 'vfxanhmekong@gmail.com'}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lưu ý ứng tuyển Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-3xs space-y-3">
                            <h4 className="text-base font-bold text-gray-900 border-l-4 border-blue-600 pl-3 uppercase tracking-wider font-display">
                                Lưu ý khi ứng tuyển
                            </h4>
                            <ul className="space-y-1.5 text-md text-gray-600 leading-snug list-disc list-inside">
                                <li>Việc phỏng vấn được thực hiện song song với thời gian nhận hồ sơ.</li>
                                <li>Chỉ liên hệ với hồ sơ đạt yêu cầu.</li>
                                <li>Hồ sơ không hoàn trả lại.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
