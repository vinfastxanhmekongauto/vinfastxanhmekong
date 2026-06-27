'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useEffect, useRef, useState } from 'react';
import { 
    Bold, 
    Italic, 
    Heading2, 
    Heading3,
    Heading4,
    List, 
    ListOrdered, 
    Code, 
    Quote, 
    Undo, 
    Redo, 
    ImagePlus,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Palette,
    ChevronDown,
    Baseline
} from 'lucide-react';

const BRAND_COLORS = ['#000000', '#dc2626', '#1e3a8a', '#4b5563', '#16a34a', '#d97706'];

const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            align: {
                default: 'center',
                parseHTML: element => element.getAttribute('data-align') || 'center',
                renderHTML: attributes => {
                    let alignmentClass = '!block !mx-auto !w-full !my-4 rounded-lg shadow-md'; // Default Center
                    if (attributes.align === 'left') {
                        alignmentClass = '!float-left !mr-6 !mb-4 !max-w-[50%] !mx-0 !block rounded-lg shadow-md';
                    } else if (attributes.align === 'right') {
                        alignmentClass = '!float-right !ml-6 !mb-4 !max-w-[50%] !mx-0 !block rounded-lg shadow-md';
                    }
                    return {
                        'data-align': attributes.align,
                        class: alignmentClass,
                    };
                },
            },
        };
    },
});

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const [customColor, setCustomColor] = useState('#000000');
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3, 4],
                },
            }),
            CustomImage,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'blockquote', 'list_item'],
            }),
            TextStyle,
            Color,
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none p-4 min-h-[220px] max-h-[500px] overflow-y-auto',
            },
        },
    });

    // Sync external value changes to editor without cursor jumps
    useEffect(() => {
        if (!editor) return;
        const currentContent = editor.getHTML();
        if (value !== currentContent) {
            // Only update editor if it's not currently focused (prevents cursor jumping)
            if (!editor.isFocused) {
                editor.commands.setContent(value, { emitUpdate: false });
            }
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div className="w-full min-h-[280px] bg-gray-50 border border-gray-300 rounded-lg animate-pulse flex items-center justify-center text-gray-400 text-sm">
                Đang tải trình soạn thảo...
            </div>
        );
    }

    // Handle local file selection (Base64 Preview)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (editor && typeof reader.result === 'string') {
                editor.chain().focus().setImage({ src: reader.result }).run();
            }
        };
        reader.readAsDataURL(file);

        // Reset the input value so the same image can be uploaded again
        e.target.value = '';
    };

    // Smart alignment handler inside the Toolbar (context-aware: image or text)
    const setAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
        if (editor.isActive('image')) {
            // Images don't support 'justify', fallback to center or ignore
            const imgAlign = alignment === 'justify' ? 'center' : alignment;
            editor.chain().focus().updateAttributes('image', { align: imgAlign }).run();
        } else {
            editor.chain().focus().setTextAlign(alignment).run();
        }
    };

    // Smart active state checker for alignment buttons
    const isAlignActive = (alignment: string) => {
        if (editor.isActive('image')) {
            return editor.isActive('image', { align: alignment });
        }
        return editor.isActive({ textAlign: alignment });
    };

    // Unified color handler: updates editor text color, caches custom color in recentColors
    const handleApplyColor = (colorHex: string) => {
        if (!editor) return;

        editor.chain().focus().setColor(colorHex).run();

        // If it's a custom color (not in predefined BRAND_COLORS), add it to recentColors
        if (!BRAND_COLORS.includes(colorHex)) {
            setRecentColors((prev) => {
                const filtered = prev.filter((c) => c !== colorHex);
                return [colorHex, ...filtered].slice(0, 5);
            });
        }

        setIsColorMenuOpen(false);
    };

    return (
        <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            {/* Toolbar Area */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 select-none">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Chữ đậm"
                >
                    <Bold size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Chữ nghiêng"
                >
                    <Italic size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Gạch ngang"
                >
                    <Strikethrough size={18} />
                </button>

                <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Tiêu đề 2"
                >
                    <Heading2 size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Tiêu đề 3"
                >
                    <Heading3 size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 4 }) ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Tiêu đề 4"
                >
                    <Heading4 size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Danh sách dấu chấm"
                >
                    <List size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Danh sách số"
                >
                    <ListOrdered size={18} />
                </button>

                <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Khối mã nguồn"
                >
                    <Code size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Trích dẫn"
                >
                    <Quote size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded text-gray-750 hover:bg-gray-200 hover:text-blue-600 transition-colors"
                    title="Chọn hình ảnh từ thiết bị"
                >
                    <ImagePlus size={18} />
                </button>

                <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => setAlignment('left')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${isAlignActive('left') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Căn lề trái"
                >
                    <AlignLeft size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => setAlignment('center')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${isAlignActive('center') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Căn giữa"
                >
                    <AlignCenter size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => setAlignment('right')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${isAlignActive('right') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Căn lề phải"
                >
                    <AlignRight size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => setAlignment('justify')}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${isAlignActive('justify') ? 'bg-gray-200 text-blue-600 font-bold' : 'text-gray-700'}`}
                    title="Căn đều hai bên"
                >
                    <AlignJustify size={18} />
                </button>

                <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
                        className={`flex items-center gap-1 p-2 rounded hover:bg-gray-200 transition-colors ${editor.getAttributes('textStyle').color ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                        title="Chọn màu chữ"
                    >
                        <Baseline size={18} />
                        <span 
                            className="w-3 h-3 rounded-full border border-gray-300" 
                            style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                        />
                        <ChevronDown size={14} className="text-gray-500" />
                    </button>

                    {isColorMenuOpen && (
                        <>
                            {/* Backdrop to close the menu on click outside */}
                            <div 
                                className="fixed inset-0 z-45" 
                                onClick={() => setIsColorMenuOpen(false)}
                            />
                            
                            <div className="absolute left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3.5 flex flex-col gap-3 min-w-[260px] animate-scale-up">
                                {/* Brand Colors */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">Màu mặc định</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {BRAND_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => handleApplyColor(color)}
                                                className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Colors */}
                                {recentColors.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">Màu gần đây</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {recentColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => handleApplyColor(color)}
                                                    className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <hr className="border-gray-200" />

                                {/* Custom Color & Clear */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <label 
                                            className="relative flex items-center justify-center w-7 h-7 rounded border border-gray-300 hover:bg-gray-50 cursor-pointer overflow-hidden transition-all shadow-xs"
                                            title="Chọn màu tùy chỉnh"
                                        >
                                            <Palette size={14} className="text-gray-500 z-10 pointer-events-none" />
                                            <input
                                                type="color"
                                                value={customColor}
                                                onChange={(e) => setCustomColor(e.target.value)}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                            {/* Preview stripe */}
                                            <div 
                                                className="absolute bottom-0 left-0 right-0 h-1 transition-all"
                                                style={{ backgroundColor: customColor }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleApplyColor(customColor)}
                                            className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            Thêm
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().unsetColor().run();
                                            setIsColorMenuOpen(false);
                                        }}
                                        className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors border border-red-200 bg-white"
                                    >
                                        Bỏ màu
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-grow"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Hoàn tác"
                >
                    <Undo size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Làm lại"
                >
                    <Redo size={18} />
                </button>
            </div>

            {/* Editor Content Area */}
            <div className="w-full bg-white">
                <EditorContent editor={editor} />
                <style dangerouslySetInnerHTML={{ __html: `
                    .ProseMirror-selectednode {
                        outline: 3px solid #3b82f6 !important;
                    }
                `}} />
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
            />
        </div>
    );
}
