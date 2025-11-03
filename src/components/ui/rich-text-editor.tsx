import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Heading2,
  Heading3,
} from 'lucide-react';
import { Button } from './button';
import { Separator } from './separator';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

interface MenuBarProps {
  editor: Editor;
}

function MenuBar({ editor }: MenuBarProps) {
  if (!editor) {
    return null;
  }

  const buttonClass = (isActive: boolean) =>
    cn(
      'h-8 w-8 p-0',
      isActive && 'bg-muted'
    );

  return (
    <div className="flex items-center gap-1 border-b p-2 flex-wrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        title="Título 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="h-8 w-8 p-0"
        title="Desfazer (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="h-8 w-8 p-0"
        title="Refazer (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Editor de texto rico usando Tiptap para o prontuário eletrônico.
 *
 * Features:
 * - Formatação básica (negrito, itálico)
 * - Títulos (H2, H3)
 * - Listas (marcadores, numeradas)
 * - Undo/Redo
 * - Contador de caracteres
 * - Placeholder customizável
 *
 * Uso:
 * ```tsx
 * <RichTextEditor
 *   value={notes}
 *   onChange={setNotes}
 *   placeholder="Digite as anotações do atendimento..."
 *   minLength={20}
 *   maxLength={10000}
 * />
 * ```
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Comece a escrever...',
  minLength,
  maxLength = 10000,
  disabled = false,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Só chama onChange se o conteúdo mudou de fato
      if (html !== value) {
        onChange(html);
      }
    },
  });

  if (!editor) {
    return null;
  }

  // Sincroniza valor externo com editor (útil quando reseta form)
  if (value !== editor.getHTML() && value === '') {
    editor.commands.setContent(value);
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  const isOverLimit = maxLength && characterCount > maxLength;
  const isUnderMinLimit = minLength && characterCount < minLength;

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <MenuBar editor={editor} />

      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
          'prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg',
          'prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
          disabled && 'pointer-events-none'
        )}
      />

      <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {characterCount} {maxLength ? `/ ${maxLength}` : ''} caracteres
          </span>
          <span>•</span>
          <span>{wordCount} palavras</span>
        </div>

        {(isOverLimit || isUnderMinLimit) && (
          <div className="text-destructive font-medium">
            {isOverLimit && `Limite excedido em ${characterCount - maxLength} caracteres`}
            {isUnderMinLimit && `Mínimo ${minLength} caracteres (faltam ${minLength - characterCount})`}
          </div>
        )}
      </div>
    </div>
  );
}
