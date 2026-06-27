'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
    Bold, Italic, List, ListOrdered,
    Heading2, Heading3, Heading4, ImageIcon, FileText
} from 'lucide-react';
import * as mammoth from 'mammoth';
import { useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-2xl shadow-md max-w-full h-auto my-4',
                },
            }),
        ],
        immediatelyRender: false,
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] p-4 font-be-vietnam-pro',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return <div className="min-h-[200px] border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center animate-pulse">Đang tải bộ soạn thảo...</div>;
    }

    const addImage = () => {
        const url = window.prompt('Nhập URL hình ảnh:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

            // Append or replace content. Here we replace it.
            editor.commands.setContent(result.value);

            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error importing Word document:', error);
            alert('Có lỗi xảy ra khi nhập file Word. Hãy đảm bảo file đúng định dạng .docx');
        }
    };

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900 font-bold' : ''}`}
                    title="In đậm"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : ''}`}
                    title="In nghiêng"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900 font-bold' : ''}`}
                    title="Tiêu đề 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900 font-bold' : ''}`}
                    title="Tiêu đề 3"
                >
                    <Heading3 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('heading', { level: 4 }) ? 'bg-gray-200 text-gray-900 font-bold' : ''}`}
                    title="Tiêu đề 4"
                >
                    <Heading4 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : ''}`}
                    title="Danh sách không thứ tự"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : ''}`}
                    title="Danh sách có thứ tự"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                <button
                    type="button"
                    onClick={addImage}
                    className="p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                    title="Chèn URL hình ảnh"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>

                <div className="flex-1"></div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded hover:bg-blue-100 transition-colors border border-blue-200"
                    title="Nhập nội dung từ file Word (.docx)"
                >
                    <FileText className="w-4 h-4" />
                    Nhập từ file Word
                </button>
                <input
                    type="file"
                    accept=".docx"
                    ref={fileInputRef}
                    onChange={handleWordImport}
                    className="hidden"
                />
            </div>

            <div className="bg-white prose prose-sm max-w-none" onClick={() => editor.commands.focus()}>
                <EditorContent editor={editor} />
                <style jsx global>{`
                    .tiptap ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                    .tiptap ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                `}</style>
            </div>
        </div>
    );
}
