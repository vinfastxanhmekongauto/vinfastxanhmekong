'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

interface TiptapEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}

export default function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: value || '',
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
    });

    // Keep editor content in sync with external value changes (e.g., switching tabs/manual resets)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            {/* Toolbar Header */}
            <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 transition-colors ${
                        editor.isActive('bold') ? 'bg-gray-200 text-blue-600 font-bold' : ''
                    }`}
                    title="In đậm (Bold)"
                >
                    <Bold size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 transition-colors ${
                        editor.isActive('italic') ? 'bg-gray-200 text-blue-600 font-bold' : ''
                    }`}
                    title="In nghiêng (Italic)"
                >
                    <Italic size={16} />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 transition-colors ${
                        editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600 font-bold' : ''
                    }`}
                    title="Danh sách dấu chấm (Bullet List)"
                >
                    <List size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded text-gray-600 hover:bg-gray-200 transition-colors ${
                        editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600 font-bold' : ''
                    }`}
                    title="Danh sách số (Ordered List)"
                >
                    <ListOrdered size={16} />
                </button>
            </div>

            {/* Editor Area */}
            <div className="p-3 min-h-[100px] text-sm text-gray-800 leading-relaxed outline-none">
                <EditorContent editor={editor} className="outline-none focus:outline-none min-h-[80px]" />
            </div>
        </div>
    );
}
