'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Search,
    BookOpen,
    AlertTriangle,
    Info,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    Car,
    Calendar,
    Menu,
    X,
    Printer,
    Share2,
    Bookmark,
    Loader2,
    Layers
} from 'lucide-react';

interface BlockData {
    text?: string;
    title?: string;
    style?: 'info' | 'danger' | 'warning' | 'success' | string;
    items?: string[];
    url?: string;
}

interface ContentBlock {
    type: 'paragraph' | 'alert' | 'heading' | 'list' | 'image' | string;
    data?: BlockData;
    text?: string;
    title?: string;
    style?: string;
    url?: string;
}

interface SectionNode {
    id?: string;
    title: string;
    blocks?: ContentBlock[];
    children?: SectionNode[];
}

interface VehicleManual {
    id: string;
    car_name: string;
    manufacture_year: number;
    version?: string;
    document: SectionNode[];
    created_at?: string;
    updated_at?: string;
}

// ----------------------------------------------------------------------
// 1. RenderBlocks Component (Lowest level content renderer)
// ----------------------------------------------------------------------
function RenderBlocks({ blocks }: { blocks: ContentBlock[] }) {
    if (!blocks || blocks.length === 0) return null;

    return (
        <div className="space-y-4 my-3">
            {blocks.map((block, index) => {
                const text = block.data?.text || block.text || '';
                const title = block.data?.title || block.title || '';
                const style = block.data?.style || block.style || 'info';
                const items = block.data?.items || [];

                if (block.type === 'paragraph') {
                    return (
                        <div
                            key={index}
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&>ol]:list-decimal [&>ol]:pl-5 [&>ul]:list-disc [&>ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    );
                }

                if (block.type === 'alert') {
                    const isDanger = style === 'danger' || style === 'warning';
                    return (
                        <div
                            key={index}
                            className={`my-5 border-l-4 p-4 rounded-r-lg shadow-sm ${
                                isDanger ? 'bg-red-50 border-red-600' : 'bg-blue-50 border-blue-600'
                            }`}
                        >
                            <div className="flex gap-3">
                                {isDanger ? (
                                    <AlertTriangle size={22} className="text-red-600 shrink-0 mt-0.5" />
                                ) : (
                                    <Info size={22} className="text-blue-600 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    {title && (
                                        <h4 className={`font-bold text-sm uppercase mb-1 ${isDanger ? 'text-red-900' : 'text-blue-900'}`}>
                                            {title}
                                        </h4>
                                    )}
                                    <p className={`text-sm leading-relaxed ${isDanger ? 'text-red-800' : 'text-blue-800'}`}>
                                        {text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }

                if (block.type === 'heading') {
                    return (
                        <h4 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2">
                            {text}
                        </h4>
                    );
                }

                if (block.type === 'list') {
                    return (
                        <div key={index} className="my-3">
                            {title && <h5 className="font-bold text-gray-900 text-sm mb-2">{title}</h5>}
                            <ul className="space-y-2 text-sm text-gray-700 pl-1">
                                {items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                }

                if (block.type === 'image') {
                    const url = block.data?.url || (block as any).url || '';
                    if (!url) return null;
                    return (
                        <figure key={index} className="my-6">
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm max-w-2xl mx-auto">
                                <img
                                    src={url}
                                    alt={text || 'Hình ảnh hướng dẫn sử dụng'}
                                    className="w-full h-auto max-h-[450px] object-contain mx-auto"
                                />
                            </div>
                            {text && (
                                <figcaption className="text-center text-xs text-gray-500 font-medium mt-2 italic">
                                    {text}
                                </figcaption>
                            )}
                        </figure>
                    );
                }

                return text ? (
                    <p key={index} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {text}
                    </p>
                ) : null;
            })}
        </div>
    );
}

// ----------------------------------------------------------------------
// 2. RenderSection Component (Recursive section & children renderer)
// ----------------------------------------------------------------------
function RenderSection({ section, level }: { section: SectionNode; level: number }) {
    if (!section) return null;

    const sectionSlug = section.id || section.title.toLowerCase().replace(/\s+/g, '-');

    return (
        <section id={sectionSlug} className="mb-8 scroll-mt-36">
            {/* Level-based Heading Styling */}
            {level === 1 && (
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 border-b border-gray-200 pb-3 pt-4 mb-4">
                    {section.title}
                </h2>
            )}

            {level === 2 && (
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    {section.title}
                </h3>
            )}

            {level >= 3 && (
                <h4 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                    {section.title}
                </h4>
            )}

            {/* Render Blocks */}
            {section.blocks && section.blocks.length > 0 && (
                <RenderBlocks blocks={section.blocks} />
            )}

            {/* Recursive Children Rendering */}
            {section.children && section.children.length > 0 && (
                <div className={level === 1 ? "pl-0 sm:pl-2 space-y-6 mt-4" : "pl-4 border-l-2 border-gray-100 space-y-4 mt-3"}>
                    {section.children.map((child, idx) => (
                        <RenderSection key={child.id || `${section.title}-child-${idx}`} section={child} level={level + 1} />
                    ))}
                </div>
            )}
        </section>
    );
}

// ----------------------------------------------------------------------
// 3. Main ManualPage Component
// ----------------------------------------------------------------------
export default function ManualPage() {
    const [manuals, setManuals] = useState<VehicleManual[]>([]);
    const [selectedManualId, setSelectedManualId] = useState<string>('');
    const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(null);
    const [expandedNavIds, setExpandedNavIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch single-table records from `vehicle_manuals`
    useEffect(() => {
        const fetchVehicleManuals = async () => {
            try {
                setIsLoading(true);
                const { data } = await supabase
                    .from('vehicle_manuals')
                    .select('*')
                    .order('car_name', { ascending: true });

                if (data && data.length > 0) {
                    setManuals(data);
                    setSelectedManualId(data[0].id);
                } else {
                    setManuals([]);
                }
            } catch (err) {
                console.error("Error fetching vehicle_manuals from Supabase:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVehicleManuals();
    }, []);

    // Currently active vehicle manual
    const activeManual = useMemo(() => {
        return manuals.find(m => m.id === selectedManualId) || manuals[0] || null;
    }, [manuals, selectedManualId]);

    // Top-level document sections
    const documentSections: SectionNode[] = useMemo(() => {
        if (!activeManual?.document) return [];
        return Array.isArray(activeManual.document) ? activeManual.document : [];
    }, [activeManual]);

    // Expand top-level sidebar items when active manual changes
    useEffect(() => {
        if (documentSections.length > 0) {
            const firstTitle = documentSections[0].title;
            setActiveSectionTitle(firstTitle);
            setExpandedNavIds(documentSections.map((sec, idx) => sec.id || `nav-${idx}`));
        }
    }, [documentSections]);

    const toggleNavExpand = (navId: string) => {
        setExpandedNavIds(prev =>
            prev.includes(navId) ? prev.filter(id => id !== navId) : [...prev, navId]
        );
    };

    const scrollToSection = (title: string) => {
        setActiveSectionTitle(title);
        setIsSidebarOpen(false);
        const slug = title.toLowerCase().replace(/\s+/g, '-');
        const element = document.getElementById(slug);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            {/* Top Bar: Controls & Filters */}
            <div className="sticky top-[95px] z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                        {/* Selectors: Vehicle & Year */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                aria-label="Toggle Navigation Categories"
                            >
                                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

                            {/* Vehicle Selector */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 font-semibold text-sm">
                                    <Car size={16} />
                                    <span>Sổ tay mẫu xe:</span>
                                </div>
                                {isLoading ? (
                                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded-lg" />
                                ) : (
                                    <select
                                        value={selectedManualId}
                                        onChange={(e) => setSelectedManualId(e.target.value)}
                                        className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all cursor-pointer"
                                    >
                                        {manuals.length > 0 ? (
                                            manuals.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.car_name} ({m.manufacture_year})
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">Chưa có dữ liệu sổ tay</option>
                                        )}
                                    </select>
                                )}
                            </div>

                            {/* Version Badge */}
                            {activeManual?.version && (
                                <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                                    <Layers size={14} className="text-gray-500" />
                                    <span>Phiên bản: {activeManual.version}</span>
                                </div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={activeManual ? `Tìm kiếm trong sổ tay ${activeManual.car_name}...` : "Tìm kiếm hướng dẫn..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Left Sidebar (Dynamic JSON document top-level items) */}
                    <aside className={`
                        fixed inset-y-0 left-0 z-40 w-72 bg-white p-4 border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:static md:w-auto md:bg-transparent md:p-0 md:border-none md:transform-none md:col-span-4 lg:col-span-3
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm sticky top-[180px] h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain pb-8">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                    <BookOpen size={18} className="text-blue-600" />
                                    Mục lục sổ tay
                                </h3>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="md:hidden text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="space-y-3 py-4">
                                    <div className="h-6 bg-gray-200 animate-pulse rounded" />
                                    <div className="h-6 bg-gray-200 animate-pulse rounded w-4/5" />
                                    <div className="h-6 bg-gray-200 animate-pulse rounded w-2/3" />
                                </div>
                            ) : documentSections.length === 0 ? (
                                <p className="text-xs text-gray-500 py-4 italic text-center">
                                    Chưa có mục lục cho sổ tay này.
                                </p>
                            ) : (
                                <nav className="space-y-1.5">
                                    {documentSections.map((sec, idx) => {
                                        const navId = sec.id || `nav-${idx}`;
                                        const isExpanded = expandedNavIds.includes(navId);
                                        const hasChildren = sec.children && sec.children.length > 0;
                                        const isActive = activeSectionTitle === sec.title;

                                        return (
                                            <div key={navId} className="rounded-lg overflow-hidden">
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => scrollToSection(sec.title)}
                                                        className={`
                                                            flex-1 text-left p-2 text-sm rounded-lg transition-colors font-semibold flex items-center gap-2
                                                            ${isActive
                                                                ? 'bg-blue-600 text-white font-bold shadow-sm'
                                                                : 'text-gray-800 hover:bg-blue-50 hover:text-blue-600'
                                                            }
                                                        `}
                                                    >
                                                        <BookOpen size={15} className={`shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                                                        <span className="truncate">{sec.title}</span>
                                                    </button>

                                                    {hasChildren && (
                                                        <button
                                                            onClick={() => toggleNavExpand(navId)}
                                                            className="p-2 text-gray-500 hover:text-gray-900"
                                                        >
                                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Sub-sections nav */}
                                                {hasChildren && isExpanded && (
                                                    <div className="pl-6 pr-1 py-1 space-y-1">
                                                        {sec.children?.map((child, cIdx) => (
                                                            <button
                                                                key={child.id || `child-${cIdx}`}
                                                                onClick={() => scrollToSection(child.title)}
                                                                className={`
                                                                    w-full text-left py-1 px-2.5 text-xs rounded transition-colors block font-medium truncate
                                                                    ${activeSectionTitle === child.title
                                                                        ? 'text-blue-600 font-bold bg-blue-50 border-l-2 border-blue-600'
                                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                                    }
                                                                `}
                                                            >
                                                                {child.title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>
                    </aside>

                    {/* Overlay for mobile drawer */}
                    {isSidebarOpen && (
                        <div
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/40 z-30 md:hidden"
                        />
                    )}

                    {/* Main Content Area */}
                    <main className="md:col-span-8 lg:col-span-9">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">

                            {/* Breadcrumbs */}
                            <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
                                <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
                                <ChevronRight size={12} />
                                <Link href="/dich-vu" className="hover:text-blue-600 transition-colors">Dịch vụ</Link>
                                <ChevronRight size={12} />
                                <span className="text-gray-900 font-medium">Hướng dẫn sử dụng</span>
                                {activeManual && (
                                    <>
                                        <ChevronRight size={12} />
                                        <span className="text-blue-600 font-semibold">{activeManual.car_name} ({activeManual.manufacture_year})</span>
                                    </>
                                )}
                            </nav>

                            {/* Page Header */}
                            <div className="border-b border-gray-200 pb-6 mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        {activeManual && (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
                                                {activeManual.car_name} • Năm {activeManual.manufacture_year} {activeManual.version ? `• ${activeManual.version}` : ''}
                                            </div>
                                        )}
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                            {activeManual ? `Sổ Tay Hướng Dẫn Sử Dụng ${activeManual.car_name}` : "Sổ Tay Hướng Dẫn Sử Dụng Xe VinFast"}
                                        </h1>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title="In trang">
                                            <Printer size={18} />
                                        </button>
                                        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title="Chia sẻ">
                                            <Share2 size={18} />
                                        </button>
                                        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title="Lưu bài viết">
                                            <Bookmark size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recursive Content Section Renderer */}
                            <div className="prose max-w-none space-y-6 text-gray-700 leading-relaxed">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                                        <Loader2 size={32} className="animate-spin text-blue-600" />
                                        <p className="text-sm font-medium">Đang tải sổ tay hướng dẫn từ hệ thống...</p>
                                    </div>
                                ) : documentSections.length > 0 ? (
                                    documentSections.map((sec, idx) => (
                                        <RenderSection
                                            key={sec.id || `doc-section-${idx}`}
                                            section={sec}
                                            level={1}
                                        />
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-gray-500">
                                        <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="font-semibold text-base text-gray-700">Chưa có dữ liệu sổ tay hướng dẫn</p>
                                        <p className="text-xs text-gray-400 mt-1">Vui lòng kiểm tra lại bảng vehicle_manuals trong Supabase.</p>
                                    </div>
                                )}

                                {/* Pagination / Footer Navigation */}
                                <div className="pt-8 mt-8 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-left">
                                        <span className="text-xs text-gray-400 block uppercase font-semibold mb-1">Bài trước</span>
                                        <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                                            &larr; Mục trước
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block uppercase font-semibold mb-1">Bài tiếp theo</span>
                                        <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                                            Mục tiếp &rarr;
                                        </span>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}
