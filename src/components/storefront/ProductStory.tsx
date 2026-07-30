import { useState } from "react";
import { X, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ProductStory({ videoUrl, productName, inline }: { videoUrl?: string, productName: string, inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!videoUrl || !isVisible) return null;

  return (
    <>
      <div className={`${inline ? 'relative inline-block' : 'fixed left-6 bottom-28 z-40'} group animate-in slide-in-from-left`}>
        <button
          onClick={() => setOpen(true)}
          className="h-16 w-16 rounded-xl border-[3px] border-accent shadow-elevated overflow-hidden bg-white p-0.5"
          aria-label="Ver story do produto"
        >
          <div className="h-full w-full rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10 transition-opacity group-hover:bg-black/30 pointer-events-none">
              <Play className="h-5 w-5 fill-white text-white opacity-80 drop-shadow-md" />
            </div>
            <video 
              src={videoUrl}
              autoPlay={true}
              loop={true}
              muted={true}
              playsInline={true}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          aria-label="Fechar story"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] h-[80vh] p-0 overflow-hidden bg-black border-none sm:rounded-2xl">
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="absolute top-4 left-4 z-50 text-white font-bold text-sm text-shadow">
            {productName}
          </div>

          <div className="h-full w-full bg-slate-900 flex items-center justify-center relative">
            <video 
              autoPlay 
              loop 
              controls
              playsInline
              className="w-full h-full object-cover"
              src={videoUrl}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
