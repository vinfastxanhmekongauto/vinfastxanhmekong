import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import type { JSONContent } from '@tiptap/core';

/**
 * Server-safe utility to render Tiptap JSON content to HTML.
 * Uses the same extensions as LandingPageEditor to ensure parity.
 */
export function renderDescriptionJson(json: JSONContent): string {
    try {
        return generateHTML(json, [
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
        ]);
    } catch (error) {
        console.error('Error rendering description JSON:', error);
        return '<p>Không thể hiển thị nội dung. Vui lòng thử lại.</p>';
    }
}
