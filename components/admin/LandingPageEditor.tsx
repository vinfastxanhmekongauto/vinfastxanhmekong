'use client';

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import {
    Bold, Italic, Underline as UnderlineIcon, Highlighter,
    List, ListOrdered, ImageIcon, FileText,
    Heading1, Heading2, Heading3,
    AlignLeft, AlignCenter, AlignRight,
    Minus, Palette, Undo2, Redo2,
    LayoutTemplate
} from 'lucide-react';
import * as mammoth from 'mammoth';
import { useRef, useCallback } from 'react';

interface LandingPageEditorProps {
    value: JSONContent | null;
    onChange: (value: JSONContent) => void;
    /** Fallback: if we have legacy HTML content but no JSON yet */
    legacyHtml?: string;
}

const BRAND_COLORS = [
    { label: 'VinFast Blue', value: '#1464F4' },
    { label: 'Navy', value: '#152B4D' },
    { label: 'White', value: '#FFFFFF' },
    { label: 'Dark', value: '#1a1a1a' },
    { label: 'Gray', value: '#6B7280' },
    { label: 'Green', value: '#10B981' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Amber', value: '#F59E0B' },
];

export default function LandingPageEditor({ value, onChange, legacyHtml }: LandingPageEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Determine initial content: prefer JSON, fallback to legacy HTML
    const initialContent = value && Object.keys(value).length > 0
        ? value
        : legacyHtml
            ? legacyHtml
            : '<p></p>';

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                horizontalRule: false, // We use the standalone extension
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl shadow-md max-w-full h-auto my-4 mx-auto',
                },
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'Nhập tiêu đề...';
                    }
                    return 'Nhập nội dung mô tả xe tại đây. Sử dụng thanh công cụ phía trên để định dạng như một Landing Page chuyên nghiệp...';
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            Highlight.configure({
                multicolor: true,
            }),
            TextStyle,
            Color,
            HorizontalRule,
        ],
        immediatelyRender: false,
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[400px] p-6 font-be-vietnam-pro',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    const addImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Nhập URL hình ảnh:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handleWordImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const options = {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Heading 4'] => h4:fresh",
                    "p[style-name='List Paragraph'] => ul > li:fresh",
                    "p[style-name='List'] => ul > li:fresh",
                    "p[style-name='List Bullet'] => ul > li:fresh",
                    "p[style-name='List Number'] => ol > li:fresh"
                ]
            };
            const result = await mammoth.convertToHtml({ arrayBuffer }, options);
            editor.commands.setContent(result.value);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error importing Word document:', error);
            alert('Có lỗi xảy ra khi nhập file Word. Hãy đảm bảo file đúng định dạng .docx');
        }
    }, [editor]);

    if (!editor) {
        return (
            <div className="min-h-[400px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center animate-pulse">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <LayoutTemplate className="w-8 h-8" />
                    <span className="text-sm font-medium">Đang tải Landing Page Editor...</span>
                </div>
            </div>
        );
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        title,
        children,
        className = ''
    }: {
        onClick: () => void;
        isActive?: boolean;
        title: string;
        children: React.ReactNode;
        className?: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-1.5 rounded transition-all ${isActive
                ? 'bg-vinfast-blue/10 text-vinfast-blue ring-1 ring-vinfast-blue/30'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            } ${className}`}
            title={title}
        >
            {children}
        </button>
    );

    const ToolbarDivider = () => <div className="w-px h-6 bg-gray-200 mx-0.5 shrink-0"></div>;

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Editor Header Badge */}
            <div className="bg-gradient-to-r from-[#152B4D] to-[#1464F4] px-4 py-2 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-white/80" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Landing Page Editor</span>
                <span className="text-[10px] text-white/50 ml-1">• Output: JSON</span>
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white/80 text-xs font-medium rounded hover:bg-white/20 transition-colors border border-white/10"
                    title="Nhập nội dung từ file Word (.docx)"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Import .docx
                </button>
                <input
                    type="file"
                    accept=".docx"
                    ref={fileInputRef}
                    onChange={handleWordImport}
                    className="hidden"
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50/80 px-3 py-1.5">
                {/* Undo/Redo */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)">
                    <Undo2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)">
                    <Redo2 className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="In đậm (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="In nghiêng (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Gạch chân (Ctrl+U)"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    isActive={editor.isActive('highlight')}
                    title="Tô sáng"
                >
                    <Highlighter className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Tiêu đề H1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Tiêu đề H2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Tiêu đề H3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Căn trái"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Căn giữa"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Căn phải"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Danh sách không thứ tự"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Danh sách có thứ tự"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Insert */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Đường phân cách"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addImage} title="Chèn hình ảnh">
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Color picker */}
                <div className="relative group">
                    <ToolbarButton onClick={() => {}} title="Màu chữ">
                        <Palette className="w-4 h-4" />
                    </ToolbarButton>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 min-w-[160px]">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Brand Colors</div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {BRAND_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => editor.chain().focus().setColor(c.value).run()}
                                    className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().unsetColor().run()}
                            className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 py-1 hover:bg-gray-50 rounded transition-colors"
                        >
                            Xóa màu
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Content Area */}
            <div
                className="bg-white"
                onClick={() => editor.commands.focus()}
            >
                <EditorContent editor={editor} />
                <style jsx global>{`
                    .tiptap ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                    .tiptap ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                    .tiptap hr { border-top: 2px solid #e5e7eb; margin: 1.5rem 0; }
                    .tiptap p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #adb5bd;
                        pointer-events: none;
                        height: 0;
                        font-style: italic;
                    }
                    .tiptap h1.is-empty::before,
                    .tiptap h2.is-empty::before,
                    .tiptap h3.is-empty::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #adb5bd;
                        pointer-events: none;
                        height: 0;
                        font-style: italic;
                    }
                    .tiptap mark { background-color: #fef08a; padding: 0.1em 0.2em; border-radius: 0.2em; }
                    .tiptap img { border-radius: 0.75rem; }
                `}</style>
            </div>

            {/* Footer status */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium">
                    Dữ liệu lưu trữ: JSONB • Tương thích Server-Side Rendering
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                    {editor.storage.characterCount?.characters?.() ?? '–'} ký tự
                </span>
            </div>
        </div>
    );
}
