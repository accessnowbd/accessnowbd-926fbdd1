import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

export function ImageZoomModal({ src, alt, open, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScale(1);
    setPos({ x: 0, y: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(5, s + 0.25));
      if (e.key === "-") setScale((s) => Math.max(1, s - 0.25));
      if (e.key === "0") { setScale(1); setPos({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const zoomIn = () => setScale((s) => Math.min(5, +(s + 0.5).toFixed(2)));
  const zoomOut = () => setScale((s) => {
    const next = Math.max(1, +(s - 0.5).toFixed(2));
    if (next === 1) setPos({ x: 0, y: 0 });
    return next;
  });
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((s) => {
      const next = Math.max(1, Math.min(5, +(s + delta).toFixed(2)));
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  };

  const onImgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) setScale(2);
    else reset();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    setDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPos({
      x: dragRef.current.px + (e.clientX - dragRef.current.x),
      y: dragRef.current.py + (e.clientY - dragRef.current.y),
    });
  };
  const stopDrag = () => { dragRef.current = null; setDragging(false); };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm grid place-items-center animate-[zm-in_180ms_ease-out]"
      onClick={onClose}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <style>{`@keyframes zm-in{from{opacity:0}to{opacity:1}}@keyframes zm-img{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Toolbar */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1.5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={zoomOut} className="p-2 rounded-full hover:bg-white/20 transition disabled:opacity-40" disabled={scale <= 1} aria-label="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="min-w-[54px] text-center text-xs font-bold tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className="p-2 rounded-full hover:bg-white/20 transition disabled:opacity-40" disabled={scale >= 5} aria-label="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-white/20 mx-1" />
        <button onClick={reset} className="p-2 rounded-full hover:bg-white/20 transition" aria-label="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-[11px] font-medium tracking-wide flex items-center gap-2 pointer-events-none">
        <Maximize2 className="w-3 h-3" /> Click to zoom · Scroll · Drag · Esc to close
      </div>

      {/* Image */}
      <div className="relative w-full h-full grid place-items-center overflow-hidden select-none px-6 py-16">
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          onClick={onImgClick}
          onMouseDown={onMouseDown}
          className="max-w-[92vw] max-h-[82vh] object-contain rounded-xl shadow-2xl transition-transform duration-200 ease-out will-change-transform animate-[zm-img_220ms_ease-out]"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
            transitionDuration: dragging ? "0ms" : "200ms",
          }}
        />
      </div>
    </div>
  );
}
