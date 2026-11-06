'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import TiptapEditor from '@/components/TiptapEditor';
import {
    BookOpen,
    Edit3,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    FileJson,
    Car,
    Calendar,
    Layers,
    Save,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Sliders,
    Type,
    List,
    AlertTriangle,
    Info,
    ChevronDown,
    ChevronRight,
    Image as ImageIcon,
    Upload,
    X
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

type TabType = 'visual' | 'json';

// Normalize block data structure
const normalizeBlock = (block: ContentBlock): { type: string; text: string; title: string; style: string; items: string[]; url: string } => {
    return {
        type: block.type || 'paragraph',
        text: block.data?.text || block.text || '',
        title: block.data?.title || block.title || '',
        style: block.data?.style || block.style || 'info',
        items: block.data?.items || [],
        url: block.data?.url || block.url || ''
    };
};

// Helper: Extract image URLs from section or block for storage cleanup
const extractImageStorageItems = (item: SectionNode | ContentBlock): { bucket: string; path: string }[] => {
    const results: { bucket: string; path: string }[] = [];

    const checkBlock = (b: ContentBlock) => {
        if (b.type === 'image') {
            const url = b.data?.url || b.url || '';
            if (url) {
                // Regex to extract bucket and relative file path from Supabase storage URL
                const match = url.match(/\/object\/public\/([^\/]+)\/(.+)$/);
                if (match) {
                    results.push({ bucket: match[1], path: match[2] });
                }
            }
        }
    };

    const checkSection = (sec: SectionNode) => {
        if (sec.blocks) sec.blocks.forEach(checkBlock);
        if (sec.children) sec.children.forEach(checkSection);
    };

    if ('type' in item) {
        checkBlock(item as ContentBlock);
    } else {
        checkSection(item as SectionNode);
    }

    return results;
};

// Remove image files from Supabase Storage
const removeStorageFiles = async (items: { bucket: string; path: string }[]) => {
    for (const item of items) {
        try {
            await supabase.storage.from(item.bucket).remove([item.path]);
        } catch (err) {
            console.error(`Error deleting storage file (${item.bucket}/${item.path}):`, err);
        }
    }
};

export default function AdminManualEditPage() {
    const params = useParams();
    const id = params?.id as string;

    const [carName, setCarName] = useState('');
    const [year, setYear] = useState('');
    const [version, setVersion] = useState('');
    const [documentJson, setDocumentJson] = useState('[]');
    const [parsedDocument, setParsedDocument] = useState<SectionNode[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('visual');

    // Accordion UI state for open/closed section paths
    const [expandedPaths, setExpandedPaths] = useState<string[]>(['0', '1']);

    const [isFetching, setIsFetching] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingBlockKey, setUploadingBlockKey] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch existing manual record by ID
    useEffect(() => {
        if (!id) return;

        const fetchManualDetail = async () => {
            try {
                setIsFetching(true);
                const { data, error } = await supabase
                    .from('vehicle_manuals')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    setCarName(data.car_name || '');
                    setYear(data.manufacture_year ? data.manufacture_year.toString() : '');
                    setVersion(data.version || 'v1.0');
                    if (data.document) {
                        const docObj = Array.isArray(data.document) ? data.document : [];
                        setParsedDocument(docObj);
                        setDocumentJson(JSON.stringify(docObj, null, 2));
                        // Default expand root level section paths
                        setExpandedPaths(docObj.map((_: unknown, idx: number) => `${idx}`));
                    }
                }
            } catch (err: any) {
                console.error("Error fetching manual detail from Supabase:", err);
                setMessage({
                    type: 'error',
                    text: `Không thể tải thông tin sổ tay: ${err.message}`
                });
            } finally {
                setIsFetching(false);
            }
        };

        fetchManualDetail();
    }, [id]);

    // Update parsed document & sync to raw JSON string
    const updateDocState = (newDoc: SectionNode[]) => {
        setParsedDocument(newDoc);
        setDocumentJson(JSON.stringify(newDoc, null, 2));
    };

    // Accordion toggle helper
    const togglePathExpand = (pathKey: string) => {
        setExpandedPaths(prev =>
            prev.includes(pathKey)
                ? prev.filter(p => p !== pathKey)
                : [...prev, pathKey]
        );
    };

    // Tab switcher with JSON validation check
    const handleTabChange = (tab: TabType) => {
        if (tab === 'visual' && activeTab === 'json') {
            try {
                const parsed = JSON.parse(documentJson);
                const docArray = Array.isArray(parsed) ? parsed : [];
                setParsedDocument(docArray);
                setExpandedPaths(docArray.map((_: unknown, idx: number) => `${idx}`));
                setMessage(null);
            } catch (jsonErr: any) {
                setMessage({
                    type: 'error',
                    text: `Cú pháp JSON không hợp lệ. Vui lòng sửa lỗi trước khi chuyển qua Visual Builder: ${jsonErr.message}`
                });
                return;
            }
        } else if (tab === 'json' && activeTab === 'visual') {
            setDocumentJson(JSON.stringify(parsedDocument, null, 2));
        }
        setActiveTab(tab);
    };

    // --- VISUAL BUILDER MUTATIONS ---

    const addTopLevelSection = () => {
        const newIndex = parsedDocument.length;
        const newDoc = [...parsedDocument, { title: 'Mục mới', blocks: [], children: [] }];
        updateDocState(newDoc);
        setExpandedPaths(prev => [...prev, `${newIndex}`]);
    };

    const updateSectionInTree = (nodes: SectionNode[], targetPath: number[], updater: (sec: SectionNode) => SectionNode): SectionNode[] => {
        const [currentIndex, ...restPath] = targetPath;
        return nodes.map((node, i) => {
            if (i !== currentIndex) return node;
            if (restPath.length === 0) {
                return updater(node);
            }
            return {
                ...node,
                children: updateSectionInTree(node.children || [], restPath, updater)
            };
        });
    };

    const removeSectionFromTree = (nodes: SectionNode[], targetPath: number[]): SectionNode[] => {
        const [currentIndex, ...restPath] = targetPath;
        if (restPath.length === 0) {
            return nodes.filter((_, i) => i !== currentIndex);
        }
        return nodes.map((node, i) => {
            if (i !== currentIndex) return node;
            return {
                ...node,
                children: removeSectionFromTree(node.children || [], restPath)
            };
        });
    };

    const moveSectionInTree = (nodes: SectionNode[], targetPath: number[], direction: 'up' | 'down'): SectionNode[] => {
        const [currentIndex, ...restPath] = targetPath;
        if (restPath.length === 0) {
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= nodes.length) return nodes;
            const updated = [...nodes];
            const temp = updated[currentIndex];
            updated[currentIndex] = updated[newIndex];
            updated[newIndex] = temp;
            return updated;
        }
        return nodes.map((node, i) => {
            if (i !== currentIndex) return node;
            return {
                ...node,
                children: moveSectionInTree(node.children || [], restPath, direction)
            };
        });
    };

    const getSectionByPath = (nodes: SectionNode[], targetPath: number[]): SectionNode | null => {
        let current: any = nodes;
        for (let i = 0; i < targetPath.length; i++) {
            const idx = targetPath[i];
            if (i === targetPath.length - 1) {
                return current[idx] || null;
            }
            current = current[idx]?.children;
            if (!current) return null;
        }
        return null;
    };

    // Section actions
    const handleUpdateTitle = (path: number[], title: string) => {
        updateDocState(updateSectionInTree(parsedDocument, path, sec => ({ ...sec, title })));
    };

    const handleAddChildSection = (path: number[]) => {
        const pathKey = path.join('-');
        updateDocState(updateSectionInTree(parsedDocument, path, sec => ({
            ...sec,
            children: [...(sec.children || []), { title: 'Mục con mới', blocks: [], children: [] }]
        })));
        setExpandedPaths(prev => [...prev, pathKey]);
    };

    // Deep delete section with image cleanup
    const handleDeleteSection = async (path: number[]) => {
        const targetSec = getSectionByPath(parsedDocument, path);
        if (targetSec) {
            const itemsToDelete = extractImageStorageItems(targetSec);
            if (itemsToDelete.length > 0) {
                await removeStorageFiles(itemsToDelete);
            }
        }
        updateDocState(removeSectionFromTree(parsedDocument, path));
    };

    const handleMoveSection = (path: number[], direction: 'up' | 'down') => {
        updateDocState(moveSectionInTree(parsedDocument, path, direction));
    };

    // Block actions
    const handleAddBlock = (path: number[]) => {
        updateDocState(updateSectionInTree(parsedDocument, path, sec => ({
            ...sec,
            blocks: [...(sec.blocks || []), { type: 'paragraph', data: { text: 'Nội dung đoạn văn mới...' } }]
        })));
    };

    const handleUpdateBlock = (path: number[], blockIdx: number, newBlock: ContentBlock) => {
        updateDocState(updateSectionInTree(parsedDocument, path, sec => {
            const updatedBlocks = [...(sec.blocks || [])];
            updatedBlocks[blockIdx] = newBlock;
            return { ...sec, blocks: updatedBlocks };
        }));
    };

    // Deep delete block with image cleanup
    const handleDeleteBlock = async (path: number[], blockIdx: number) => {
        const targetSec = getSectionByPath(parsedDocument, path);
        if (targetSec && targetSec.blocks && targetSec.blocks[blockIdx]) {
            const targetBlock = targetSec.blocks[blockIdx];
            const itemsToDelete = extractImageStorageItems(targetBlock);
            if (itemsToDelete.length > 0) {
                await removeStorageFiles(itemsToDelete);
            }
        }

        updateDocState(updateSectionInTree(parsedDocument, path, sec => ({
            ...sec,
            blocks: (sec.blocks || []).filter((_, i) => i !== blockIdx)
        })));
    };

    const handleMoveBlock = (path: number[], blockIdx: number, direction: 'up' | 'down') => {
        updateDocState(updateSectionInTree(parsedDocument, path, sec => {
            const blocks = [...(sec.blocks || [])];
            const targetIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;
            if (targetIdx < 0 || targetIdx >= blocks.length) return sec;
            const temp = blocks[blockIdx];
            blocks[blockIdx] = blocks[targetIdx];
            blocks[targetIdx] = temp;
            return { ...sec, blocks };
        }));
    };

    // Upload image file to Supabase Storage bucket 'manual_images' (or 'images')
    const handleImageFileUpload = async (path: number[], blockIdx: number, file: File) => {
        const blockKey = `${path.join('-')}-${blockIdx}`;
        setUploadingBlockKey(blockKey);

        try {
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file hình ảnh hợp lệ.');
                return;
            }

            // Normalize filename with timestamp
            const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
            const fileName = `manuals/${Date.now()}_${cleanName}`;

            // 1. Upload to Supabase Storage bucket 'manual_images'
            let bucketName = 'manual_images';
            let { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            // Fallback to 'images' bucket if 'manual_images' is not configured
            if (uploadError) {
                bucketName = 'images';
                const fallbackResult = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                uploadData = fallbackResult.data;
                uploadError = fallbackResult.error;
            }

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(uploadData?.path || fileName);

            const publicUrl = publicUrlData.publicUrl;

            // 3. Save URL to block data
            const targetSec = getSectionByPath(parsedDocument, path);
            const currentBlock = targetSec?.blocks?.[blockIdx];
            const currentText = currentBlock?.data?.text || currentBlock?.text || '';

            handleUpdateBlock(path, blockIdx, {
                type: 'image',
                data: {
                    url: publicUrl,
                    text: currentText
                }
            });

        } catch (err: any) {
            console.error("Image upload error:", err);
            alert(`Lỗi khi tải hình ảnh: ${err.message || 'Tải ảnh thất bại'}`);
        } finally {
            setUploadingBlockKey(null);
        }
    };

    // Handle form submit
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (!carName.trim() || !year) {
                throw new Error("Vui lòng nhập Tên Mẫu Xe và Năm Sản Xuất.");
            }

            let payload: any;
            if (activeTab === 'visual') {
                payload = parsedDocument;
            } else {
                try {
                    payload = JSON.parse(documentJson);
                } catch (jsonErr: any) {
                    throw new Error(`Cú pháp JSON không hợp lệ: ${jsonErr.message}`);
                }
            }

            console.log("Submitting payload:", payload);

            const { data, error } = await supabase
                .from('vehicle_manuals')
                .update({
                    car_name: carName.trim(),
                    manufacture_year: parseInt(year, 10),
                    version: version.trim() || 'v1.0',
                    document: payload,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error("Không tìm thấy dữ liệu để cập nhật hoặc bị từ chối quyền (RLS).");
            }

            console.log("Supabase response:", data);

            setMessage({
                type: 'success',
                text: `Đã cập nhật thành công sổ tay hướng dẫn cho xe ${carName} (${year})!`
            });

        } catch (err: any) {
            console.error("Error updating manual in Supabase:", err);
            setMessage({
                type: 'error',
                text: err.message || "Đã xảy ra lỗi khi cập nhật cơ sở dữ liệu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Recursive Section Renderer Component for Visual Builder (with Accordion logic)
    const renderVisualSectionNode = (section: SectionNode, path: number[]) => {
        const isRoot = path.length === 1;
        const pathKey = path.join('-');
        const isExpanded = expandedPaths.includes(pathKey);

        return (
            <div
                key={pathKey}
                className={`rounded-xl border transition-all ${
                    isRoot
                        ? 'border-gray-300 bg-white shadow-sm p-4 sm:p-5 mb-4'
                        : 'border-blue-200 bg-blue-50/40 p-3 sm:p-4 my-3 ml-2 sm:ml-6'
                }`}
            >
                {/* Section Header Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 flex-1">

                        {/* Accordion Toggle Button */}
                        <button
                            type="button"
                            onClick={() => togglePathExpand(pathKey)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                            title={isExpanded ? "Thu gọn mục" : "Mở rộng mục"}
                        >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            isRoot ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {isRoot ? `Mục ${path[0] + 1}` : `Mục con ${path.join('.')}`}
                        </span>

                        <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleUpdateTitle(path, e.target.value)}
                            placeholder="Tiêu đề mục..."
                            className="flex-1 px-3 py-1.5 text-sm font-bold bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Reorder & Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => handleMoveSection(path, 'up')}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                            title="Di chuyển lên"
                        >
                            <ArrowUp size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMoveSection(path, 'down')}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                            title="Di chuyển xuống"
                        >
                            <ArrowDown size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeleteSection(path)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Xóa mục này và hình ảnh bên trong"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                {/* Accordion Body: Only rendered if expanded */}
                {isExpanded && (
                    <div className="pt-3 space-y-4">

                        {/* Content Blocks Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                                    <Type size={13} className="text-blue-600" />
                                    Khối nội dung ({section.blocks?.length || 0})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleAddBlock(path)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                                >
                                    <Plus size={14} /> Thêm Khối Nội Dung
                                </button>
                            </div>

                            {section.blocks && section.blocks.length > 0 && (
                                <div className="space-y-3 pl-1">
                                    {section.blocks.map((block, bIdx) => {
                                        const norm = normalizeBlock(block);
                                        const blockKey = `${pathKey}-${bIdx}`;
                                        const isUploading = uploadingBlockKey === blockKey;

                                        return (
                                            <div key={bIdx} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={norm.type}
                                                            onChange={(e) => handleUpdateBlock(path, bIdx, {
                                                                ...block,
                                                                type: e.target.value,
                                                                data: { ...block.data, text: norm.text, title: norm.title, style: norm.style, url: norm.url }
                                                            })}
                                                            className="text-xs font-semibold bg-gray-100 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="paragraph">Văn bản (Paragraph)</option>
                                                            <option value="alert">Thông báo (Alert)</option>
                                                            <option value="heading">Tiêu đề (Heading)</option>
                                                            <option value="list">Danh sách (List)</option>
                                                            <option value="image">Hình ảnh (Image)</option>
                                                        </select>

                                                        {norm.type === 'alert' && (
                                                            <select
                                                                value={norm.style}
                                                                onChange={(e) => handleUpdateBlock(path, bIdx, {
                                                                    ...block,
                                                                    data: { ...block.data, text: norm.text, title: norm.title, style: e.target.value, url: norm.url }
                                                                })}
                                                                className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded px-2 py-1"
                                                            >
                                                                <option value="info">Thông tin (Info - Xanh)</option>
                                                                <option value="warning">Cảnh báo (Warning - Vàng)</option>
                                                                <option value="danger">Nguy hiểm (Danger - Đỏ)</option>
                                                            </select>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveBlock(path, bIdx, 'up')}
                                                            className="p-1 text-gray-400 hover:text-gray-700"
                                                            title="Đưa khối lên"
                                                        >
                                                            <ArrowUp size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveBlock(path, bIdx, 'down')}
                                                            className="p-1 text-gray-400 hover:text-gray-700"
                                                            title="Đưa khối xuống"
                                                        >
                                                            <ArrowDown size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteBlock(path, bIdx)}
                                                            className="p-1 text-red-500 hover:text-red-700"
                                                            title="Xóa khối"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Image Block Upload & Preview UI */}
                                                {norm.type === 'image' && (
                                                    <div className="space-y-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                                                        <div className="flex items-center gap-2">
                                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors shadow-2xs">
                                                                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                                {isUploading ? 'Đang tải lên...' : 'Tải ảnh lên Supabase Storage'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    disabled={isUploading}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleImageFileUpload(path, bIdx, file);
                                                                    }}
                                                                />
                                                            </label>

                                                            {norm.url && (
                                                                <span className="text-[11px] text-green-700 font-medium truncate flex-1">
                                                                    ✓ Đã tải lên storage
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Image Preview */}
                                                        {norm.url ? (
                                                            <div className="relative group w-fit max-w-full rounded border overflow-hidden bg-white mt-1">
                                                                <img
                                                                    src={norm.url}
                                                                    alt={norm.text || 'Manual image preview'}
                                                                    className="h-32 w-auto object-contain bg-gray-100"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 text-center border border-dashed border-gray-300 rounded text-xs text-gray-400">
                                                                <ImageIcon size={20} className="mx-auto text-gray-300 mb-1" />
                                                                Chưa có hình ảnh. Vui lòng dán URL hoặc bấm tải ảnh lên.
                                                            </div>
                                                        )}

                                                        {/* Image URL Direct Input */}
                                                        <input
                                                            type="text"
                                                            placeholder="Hoặc dán URL hình ảnh..."
                                                            value={norm.url}
                                                            onChange={(e) => handleUpdateBlock(path, bIdx, {
                                                                ...block,
                                                                type: 'image',
                                                                data: { ...block.data, url: e.target.value, text: norm.text }
                                                            })}
                                                            className="w-full text-xs font-mono px-2.5 py-1.5 border border-gray-200 rounded bg-white"
                                                        />
                                                    </div>
                                                )}

                                                {/* Block Title Input (for Alert / List) */}
                                                {(norm.type === 'alert' || norm.type === 'list') && (
                                                    <input
                                                        type="text"
                                                        placeholder="Tiêu đề khối thông báo / danh sách..."
                                                        value={norm.title}
                                                        onChange={(e) => handleUpdateBlock(path, bIdx, {
                                                            ...block,
                                                            data: { ...block.data, title: e.target.value, text: norm.text, style: norm.style, url: norm.url }
                                                        })}
                                                        className="w-full text-xs font-semibold px-2.5 py-1.5 border border-gray-200 rounded bg-gray-50 focus:bg-white"
                                                    />
                                                )}

                                                {/* Block Main Text / Caption Area */}
                                                {norm.type === 'paragraph' ? (
                                                    <TiptapEditor
                                                        value={norm.text}
                                                        onChange={(val) => handleUpdateBlock(path, bIdx, {
                                                            ...block,
                                                            type: 'paragraph',
                                                            data: { ...block.data, text: val, title: norm.title, style: norm.style, url: norm.url }
                                                        })}
                                                    />
                                                ) : (
                                                    <textarea
                                                        rows={2}
                                                        placeholder={norm.type === 'image' ? "Chú thích hình ảnh (caption)..." : "Nội dung chính..."}
                                                        value={norm.text}
                                                        onChange={(e) => handleUpdateBlock(path, bIdx, {
                                                            ...block,
                                                            data: { ...block.data, text: e.target.value, title: norm.title, style: norm.style, url: norm.url }
                                                        })}
                                                        className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-blue-500 focus:border-blue-500 leading-relaxed bg-white"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sub-sections Children */}
                        <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                                    <Layers size={13} className="text-blue-600" />
                                    Mục con ({section.children?.length || 0})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleAddChildSection(path)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md transition-colors"
                                >
                                    <Plus size={14} /> Thêm Mục Con
                                </button>
                            </div>

                            {section.children && section.children.length > 0 && (
                                <div className="space-y-3">
                                    {section.children.map((child, cIdx) =>
                                        renderVisualSectionNode(child, [...path, cIdx])
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/huong-dan"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Quay lại Danh sách
                    </Link>

                    <Link
                        href="/dich-vu/huong-dan-su-dung"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        <BookOpen size={14} />
                        Xem Trang Client
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <div className="border-b border-gray-100 pb-5 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                                <Edit3 size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Chỉnh Sửa Sổ Tay Hướng Dẫn
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Cập nhật thông tin mẫu xe và chỉnh sửa nội dung tài liệu bằng Giao diện Trực quan hoặc Mã nguồn JSON.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Alert */}
                    {message && (
                        <div className={`p-4 rounded-lg border mb-6 flex items-start gap-3 ${
                            message.type === 'success'
                                ? 'bg-green-50 border-green-300 text-green-800'
                                : 'bg-red-50 border-red-300 text-red-800'
                        }`}>
                            {message.type === 'success' ? (
                                <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm font-medium leading-relaxed">
                                {message.text}
                            </p>
                        </div>
                    )}

                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Đang tải thông tin sổ tay hướng dẫn...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdate} className="space-y-6">

                            {/* Basic Info: 3 Columns Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                {/* Tên Mẫu Xe */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                                        <Car size={14} className="text-blue-600" />
                                        Tên Mẫu Xe
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: VF 9"
                                        value={carName}
                                        onChange={(e) => setCarName(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                                    />
                                </div>

                                {/* Năm Sản Xuất */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-blue-600" />
                                        Năm Sản Xuất
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="Ví dụ: 2026"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                                    />
                                </div>

                                {/* Phiên Bản */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                                        <Layers size={14} className="text-blue-600" />
                                        Phiên Bản
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: v1.0 hoặc 2026.1"
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                                    />
                                </div>

                            </div>

                            {/* Dual-Tab Section: Visual Builder vs Raw JSON */}
                            <div className="space-y-3 pt-2 border-t border-gray-100">

                                {/* Tab Header Buttons */}
                                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleTabChange('visual')}
                                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                                activeTab === 'visual'
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Sliders size={14} />
                                            Visual Builder (Trực quan)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleTabChange('json')}
                                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                                activeTab === 'json'
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <FileJson size={14} />
                                            Raw JSON (Mã Nguồn)
                                        </button>
                                    </div>

                                    {activeTab === 'visual' && (
                                        <button
                                            type="button"
                                            onClick={addTopLevelSection}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                                        >
                                            <Plus size={14} /> Thêm Mục Chính
                                        </button>
                                    )}
                                </div>

                                {/* Tab 1: Visual Builder */}
                                {activeTab === 'visual' && (
                                    <div className="space-y-4 pt-2">
                                        {parsedDocument.length === 0 ? (
                                            <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl space-y-3">
                                                <BookOpen size={36} className="mx-auto text-gray-300" />
                                                <p className="text-sm font-semibold text-gray-600">Chưa có mục nội dung nào.</p>
                                                <button
                                                    type="button"
                                                    onClick={addTopLevelSection}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-blue-700"
                                                >
                                                    <Plus size={14} /> Thêm Mục Đầu Tiên
                                                </button>
                                            </div>
                                        ) : (
                                            parsedDocument.map((sec, idx) =>
                                                renderVisualSectionNode(sec, [idx])
                                            )
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Raw JSON Textarea */}
                                {activeTab === 'json' && (
                                    <div className="pt-2">
                                        <textarea
                                            rows={18}
                                            required
                                            value={documentJson}
                                            onChange={(e) => setDocumentJson(e.target.value)}
                                            className="w-full p-4 font-mono text-sm bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg outline-none transition-all leading-relaxed shadow-inner"
                                            placeholder="Dán chuỗi JSON của tài liệu vào đây..."
                                        />
                                    </div>
                                )}

                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Đang cập nhật cơ sở dữ liệu...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Cập Nhật Dữ Liệu Sổ Tay
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    )}
                </div>

            </div>
        </div>
    );
}
