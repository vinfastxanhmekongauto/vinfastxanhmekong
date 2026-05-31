'use client';

import { useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import type { JSONContent } from '@tiptap/react';

interface ProductDescriptionDisplayProps {
    /** Tiptap JSON content from description_json column */
    content: JSONContent | string | null | undefined;
    /** Fallback legacy HTML from description column */
    legacyHtml?: string | null;
}

/**
 * Safely parse content into a JSONContent object.
 * Handles: object (pass-through), string (JSON.parse), null/undefined (returns null).
 */
function parseContent(raw: JSONContent | string | null | undefined): JSONContent | null {
    if (!raw) return null;

    // Already a parsed object
    if (typeof raw === 'object') {
        // Must have at least a 'type' key to be valid Tiptap JSON
        if ('type' in raw) return raw;
        // Could be an empty object {}
        if (Object.keys(raw).length === 0) return null;
        return raw;
    }

    // It's a string — try to parse
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && 'type' in parsed) {
                return parsed as JSONContent;
            }
        } catch {
            // Not valid JSON string — ignore
        }
        return null;
    }

    return null;
}

export default function ProductDescriptionDisplay({ content, legacyHtml }: ProductDescriptionDisplayProps) {
    const parsedContent = useMemo(() => parseContent(content), [content]);

    // Determine what to feed to the editor
    const editorContent = useMemo(() => {
        if (parsedContent) return parsedContent;
        if (legacyHtml) return legacyHtml; // Tiptap can accept HTML strings directly
        return null;
    }, [parsedContent, legacyHtml]);

    // Debug log (will only appear in browser console, not server)
    if (typeof window !== 'undefined') {
        console.log('[ProductDescriptionDisplay] Content type:', typeof content, '| Parsed:', parsedContent ? 'OK' : 'NULL', '| Legacy HTML:', legacyHtml ? `${legacyHtml.length} chars` : 'NULL');
    }

    // Read-only Tiptap editor with the SAME extensions as the admin LandingPageEditor
    const editor = useEditor({
        editable: false,
        immediatelyRender: false,
        content: editorContent,
        extensions: [
            StarterKit.configure({
                horizontalRule: false,
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-2xl shadow-md max-w-full h-auto my-6 mx-auto',
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
        editorProps: {
            attributes: {
                class: [
                    'prose prose-blue lg:prose-xl max-w-none font-be-vietnam-pro text-gray-700',
                    'prose-p:text-justify prose-p:mb-6 prose-p:whitespace-pre-line',
                    'prose-headings:font-bold prose-headings:mt-12 prose-headings:mb-4 prose-headings:text-left',
                    'prose-ul:list-outside prose-ul:list-disc prose-ul:pl-5',
                    'prose-ol:list-outside prose-ol:list-decimal prose-ol:pl-5',
                    'prose-li:list-item prose-li:my-2',
                    'prose-a:text-vinfast-blue',
                    'prose-img:rounded-2xl prose-img:shadow-md prose-img:my-10',
                    'focus:outline-none',
                ].join(' '),
            },
        },
    });

    // No content at all — show placeholder
    if (!editorContent) {
        return (
            <div className="prose prose-lg max-w-none text-gray-700">
                <p>Đang cập nhật nội dung chi tiết cho dòng sản phẩm này của VinFast. Vui lòng quay lại sau, hoặc để lại thông tin để nhận báo giá chi tiết qua điện thoại / email.</p>
            </div>
        );
    }

    // Editor still initializing — skeleton
    if (!editor) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-32 bg-gray-100 rounded-2xl w-full mt-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        );
    }

    return (
        <>
            <EditorContent editor={editor} />
            <style jsx global>{`
                .tiptap ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                .tiptap ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                .tiptap hr { border-top: 2px solid #e5e7eb; margin: 1.5rem 0; }
                .tiptap mark { background-color: #fef08a; padding: 0.1em 0.2em; border-radius: 0.2em; }
                .tiptap img { border-radius: 0.75rem; }
            `}</style>
        </>
    );
}
