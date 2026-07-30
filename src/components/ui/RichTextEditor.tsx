import React, { useRef, useState } from "react";
import { 
  ImagePlus, Video, Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Code
} from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const exec = (command: string, cmdValue?: string) => {
    if (htmlMode) return;
    document.execCommand(command, false, cmdValue);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        exec("insertImage", dataUrl);
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertVideo = () => {
    if (videoUrl) {
      let embedUrl = videoUrl;
      if (videoUrl.includes("youtube.com/watch?v=")) {
        embedUrl = videoUrl.replace("watch?v=", "embed/");
      }
      const html = `<br><iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen></iframe><br>`;
      exec("insertHTML", html);
    }
    setVideoModalOpen(false);
    setVideoUrl("");
  };

  const toggleHtmlMode = () => {
    setHtmlMode(!htmlMode);
  };

  // Se o valor mudar por fora (e.g. init data), não sobrescrevemos se já for igual para não perder cursor
  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML && !htmlMode) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, htmlMode]);

  return (
    <div className="border rounded-md bg-white overflow-hidden flex flex-col">
      <div className="flex items-center gap-1 border-b p-2 bg-slate-50 text-slate-600 flex-wrap">
        
        {/* Basic formatting */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("bold"); }} title="Negrito" disabled={htmlMode}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("italic"); }} title="Itálico" disabled={htmlMode}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("underline"); }} title="Sublinhado" disabled={htmlMode}>
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("strikeThrough"); }} title="Tachado" disabled={htmlMode}>
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        {/* Lists */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} title="Lista com marcadores" disabled={htmlMode}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("insertOrderedList"); }} title="Lista numerada" disabled={htmlMode}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        {/* Headings */}
        <select 
          className="h-8 border border-slate-200 rounded px-2 text-sm bg-white disabled:opacity-50"
          onChange={(e) => {
            exec("formatBlock", e.target.value);
            e.target.value = "P"; // reset back to normal conceptually or just leave it
          }}
          disabled={htmlMode}
        >
          <option value="P">Normal</option>
          <option value="H1">Título 1</option>
          <option value="H2">Título 2</option>
          <option value="H3">Título 3</option>
        </select>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        {/* Colors */}
        <div className="flex items-center gap-1 relative" title="Cor do texto">
          <span className="text-xs font-bold font-serif underline decoration-2 decoration-black">A</span>
          <input type="color" className="w-6 h-6 p-0 border-0 cursor-pointer" onChange={(e) => exec("foreColor", e.target.value)} disabled={htmlMode} />
        </div>
        <div className="flex items-center gap-1 relative ml-1" title="Cor de fundo">
          <span className="text-xs font-bold font-serif bg-yellow-200 text-black px-0.5">A</span>
          <input type="color" className="w-6 h-6 p-0 border-0 cursor-pointer" onChange={(e) => exec("hiliteColor", e.target.value)} disabled={htmlMode} />
        </div>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        {/* Alignment */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("justifyLeft"); }} title="Alinhar à esquerda" disabled={htmlMode}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("justifyCenter"); }} title="Centralizar" disabled={htmlMode}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("justifyRight"); }} title="Alinhar à direita" disabled={htmlMode}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); exec("justifyFull"); }} title="Justificar" disabled={htmlMode}>
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        {/* Media & Links */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); const url = prompt("URL do link:"); if(url) exec("createLink", url); }} title="Link" disabled={htmlMode}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }} title="Imagem" disabled={htmlMode}>
          <ImagePlus className="h-4 w-4" />
        </Button>
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageFile} />
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); setVideoModalOpen(true); }} title="Vídeo" disabled={htmlMode}>
          <Video className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-300 mx-1"></div>

        {/* HTML Toggle */}
        <Button variant={htmlMode ? "default" : "ghost"} size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); toggleHtmlMode(); }} title="Código HTML">
          <Code className="h-4 w-4" />
        </Button>
      </div>
      
      {htmlMode ? (
        <textarea
          className="p-4 min-h-[250px] focus:outline-none w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          className="p-4 min-h-[250px] max-h-[500px] overflow-y-auto focus:outline-none prose prose-sm max-w-none"
          onInput={(e) => {
            onChange(e.currentTarget.innerHTML);
          }}
          data-placeholder={placeholder}
        />
      )}
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          display: block; 
        }
      `}</style>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL do vídeo (ex: YouTube, Vimeo)</Label>
              <Input 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)} 
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoModalOpen(false)}>Cancelar</Button>
            <Button onClick={insertVideo}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
