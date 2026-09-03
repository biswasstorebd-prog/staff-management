import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  label?: string;
  onSave: (dataUrl: string) => void;
  initialSignature?: string;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label = 'কর্মীর ডিজিটাল স্বাক্ষর (Digital Signature)',
  onSave,
  initialSignature,
  required = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialSignature));

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container ? container.clientWidth : 380;
    canvas.width = width || 380;
    canvas.height = 110;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialSignature;
    }
  };

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialSignature]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSave('');
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5" id="signature-pad-container">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
          <span>{label}</span>
          {required && (
            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
              বাধ্যতামূলক
            </span>
          )}
        </span>
        {hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            id="clear-signature-button"
            className="flex items-center gap-1 text-red-600 hover:text-red-700 transition cursor-pointer text-xs font-bold"
          >
            <Eraser className="w-3 h-3" />
            মুছে ফেলুন (Clear)
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden touch-none hover:border-indigo-400 transition shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[110px] cursor-crosshair block"
          id="digital-signature-canvas"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
            <span className="font-medium text-slate-500">এখানে স্পর্শ বা মাউস দিয়ে স্বাক্ষর করুন</span>
            <span className="text-[11px] text-slate-400">Sign with finger, stylus, or mouse</span>
          </div>
        )}
      </div>
      {hasDrawn && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
          <Check className="w-3.5 h-3.5" />
          ডিজিটাল স্বাক্ষর ক্যাপচার সম্পন্ন হয়েছে (Signature Captured ✓)
        </div>
      )}
    </div>
  );
};
