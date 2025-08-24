import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
  Quote,
  LinkIcon,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Toggle } from "../ui/toggle";
import { Editor } from "@tiptap/react";
import { Button } from "../ui/button";

export default function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink()
        .run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url })
      .run();
  };

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const Options = [
    { 
      icon: <Heading1 className="size-4" />, 
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 
      pressed: editor.isActive("heading", { level: 1 }),
      title: "Heading 1"
    },
    { 
      icon: <Heading2 className="size-4" />, 
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 
      pressed: editor.isActive("heading", { level: 2 }),
      title: "Heading 2"
    },
    { 
      icon: <Heading3 className="size-4" />, 
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 
      pressed: editor.isActive("heading", { level: 3 }),
      title: "Heading 3"
    },
    { 
      icon: <Bold className="size-4" />, 
      onClick: () => editor.chain().focus().toggleBold().run(), 
      pressed: editor.isActive("bold"),
      title: "Bold"
    },
    { 
      icon: <Italic className="size-4" />, 
      onClick: () => editor.chain().focus().toggleItalic().run(), 
      pressed: editor.isActive("italic"),
      title: "Italic"
    },
    { 
      icon: <Underline className="size-4" />, 
      onClick: () => editor.chain().focus().toggleUnderline().run(), 
      pressed: editor.isActive("underline"),
      title: "Underline"
    },
    { 
      icon: <Strikethrough className="size-4" />, 
      onClick: () => editor.chain().focus().toggleStrike().run(), 
      pressed: editor.isActive("strike"),
      title: "Strikethrough"
    },
    { 
      icon: <AlignLeft className="size-4" />, 
      onClick: () => editor.chain().focus().setTextAlign("left").run(), 
      pressed: editor.isActive({ textAlign: "left" }),
      title: "Align Left"
    },
    { 
      icon: <AlignCenter className="size-4" />, 
      onClick: () => editor.chain().focus().setTextAlign("center").run(), 
      pressed: editor.isActive({ textAlign: "center" }),
      title: "Align Center"
    },
    { 
      icon: <AlignRight className="size-4" />, 
      onClick: () => editor.chain().focus().setTextAlign("right").run(), 
      pressed: editor.isActive({ textAlign: "right" }),
      title: "Align Right"
    },
    { 
      icon: <List className="size-4" />, 
      onClick: () => editor.chain().focus().toggleBulletList().run(), 
      pressed: editor.isActive("bulletList"),
      title: "Bullet List"
    },
    { 
      icon: <ListOrdered className="size-4" />, 
      onClick: () => editor.chain().focus().toggleOrderedList().run(), 
      pressed: editor.isActive("orderedList"),
      title: "Ordered List"
    },
    { 
      icon: <Quote className="size-4" />, 
      onClick: () => editor.chain().focus().toggleBlockquote().run(), 
      pressed: editor.isActive("blockquote"),
      title: "Blockquote"
    },
    { 
      icon: <LinkIcon className="size-4" />, 
      onClick: setLink, 
      pressed: editor.isActive("link"),
      title: "Add Link"
    },
    { 
      icon: <ImageIcon className="size-4" />, 
      onClick: addImage, 
      pressed: false,
      title: "Add Image"
    },
    { 
      icon: <Undo className="size-4" />, 
      onClick: () => editor.chain().focus().undo().run(), 
      pressed: false,
      disabled: !editor.can().undo(),
      title: "Undo"
    },
    { 
      icon: <Redo className="size-4" />, 
      onClick: () => editor.chain().focus().redo().run(), 
      pressed: false,
      disabled: !editor.can().redo(),
      title: "Redo"
    },
  ];

  return (
    <div className="border rounded-md p-1 mb-1 bg-slate-950 flex flex-wrap items-center gap-2 z-50">
      {Options.map((option, index) => (
        <Toggle
          key={index}
          pressed={option.pressed}
          onPressedChange={option.onClick}
          disabled={option.disabled}
          title={option.title}
          className="h-8 w-8 p-0"
        >
          {option.icon}
        </Toggle>
      ))}
    </div>
  );
}