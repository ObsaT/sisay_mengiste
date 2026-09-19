import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Minus,
  Undo,
  Redo,
  Image as ImageIcon,
} from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground/60 hover:bg-muted hover:text-foreground"
    }`;

  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const prev = editor.getAttributes("link")["href"] as string | undefined;
    const url = window.prompt("Link URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive("bold"))}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive("italic"))}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive("heading", { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive("orderedList"))}
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btn(editor.isActive("blockquote"))}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btn(false)}
        title="Divider"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button type="button" onClick={setLink} className={btn(editor.isActive("link"))} title="Link">
        <Link2 className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={addImage} className={btn(false)} title="Insert Image URL">
        <ImageIcon className="h-3.5 w-3.5" />
      </button>

      <span className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${btn(false)} disabled:opacity-30`}
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${btn(false)} disabled:opacity-30`}
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Write article content here..." }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose-amharic min-h-[280px] px-4 py-3 text-sm text-foreground outline-none focus:outline-none",
      },
    },
  });

  const wordCount = editor?.storage["characterCount"]?.words() ?? 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end border-t border-border bg-muted/20 px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground">{wordCount} words</span>
      </div>
    </div>
  );
}
