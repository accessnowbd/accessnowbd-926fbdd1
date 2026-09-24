import React, { useEffect, useRef, useState, useCallback } from "react";
import { SpinWheelSlice } from "@/lib/lucky-wheel";

interface SpinWheelCanvasProps {
  slices: SpinWheelSlice[];
  size?: number;
  spinning?: boolean;
  onSpinEnd?: (wonSlice: SpinWheelSlice, index: number) => void;
  targetIndex?: number | null;
  interactive?: boolean;
  onStartSpin?: () => void;
  centerButtonText?: string;
}

export const SpinWheelCanvas: React.FC<SpinWheelCanvasProps> = ({
  slices,
  size = 380,
  spinning = false,
  onSpinEnd,
  targetIndex = null,
  interactive = false,
  onStartSpin,
  centerButtonText = "SPIN",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const isSpinningRef = useRef(false);

  // Filter or fallback to make sure at least 2 slices exist
  const displaySlices = slices.length > 0 ? slices : [
    { id: "1", label: "10% OFF", coupon_code: "L10", discount_type: "percent", discount_value: 10, min_order_amount: 0, weight: 1, color: "#6366F1", text_color: "#FFF", is_active: true },
    { id: "2", label: "20% OFF", coupon_code: "L20", discount_type: "percent", discount_value: 20, min_order_amount: 0, weight: 1, color: "#EC4899", text_color: "#FFF", is_active: true }
  ];

  const totalSlices = displaySlices.length;
  const sliceAngle = (2 * Math.PI) / totalSlices;

  // Draw the entire wheel on canvas
  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const width = size;
      const height = size;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 16;

      // 1. Draw outer glowing ring with decorative bulbs
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
      ctx.fillStyle = "#1E1B4B";
      ctx.shadowColor = "rgba(99, 102, 241, 0.4)";
      ctx.shadowBlur = 15;
      ctx.fill();

      // Outer gold border ring
      const ringGrad = ctx.createLinearGradient(0, 0, width, height);
      ringGrad.addColorStop(0, "#F59E0B");
      ringGrad.addColorStop(0.5, "#FDE68A");
      ringGrad.addColorStop(1, "#D97706");
      ctx.lineWidth = 5;
      ctx.strokeStyle = ringGrad;
      ctx.stroke();
      ctx.restore();

      // Decorative bulbs on rim
      const numBulbs = Math.max(16, totalSlices * 2);
      for (let b = 0; b < numBulbs; b++) {
        const bulbAngle = (b / numBulbs) * 2 * Math.PI;
        const bx = centerX + (radius + 6) * Math.cos(bulbAngle);
        const by = centerY + (radius + 6) * Math.sin(bulbAngle);
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, 2 * Math.PI);
        ctx.fillStyle = b % 2 === 0 ? "#FDE047" : "#FFFFFF";
        ctx.shadowColor = "#FDE047";
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      // 2. Draw Wheel Slices
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      for (let i = 0; i < totalSlices; i++) {
        const slice = displaySlices[i];
        const start = i * sliceAngle;
        const end = (i + 1) * sliceAngle;

        // Draw wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();

        // Wedge fill
        ctx.fillStyle = slice.color || "#6366F1";
        ctx.fill();

        // Wedge separator lines
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.stroke();

        // Inner wedge gloss effect
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius * 0.98, start, start + sliceAngle * 0.35);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fill();
        ctx.restore();

        // Draw text
        ctx.save();
        const midAngle = start + sliceAngle / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = slice.text_color || "#FFFFFF";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Dynamic font size depending on slice count
        const fontSize = Math.max(11, Math.min(15, Math.floor(170 / totalSlices)));
        ctx.font = `bold ${fontSize}px 'Poppins', 'Inter', sans-serif`;

        // Position text ~75% out from center
        const textDistance = radius * 0.85;
        ctx.fillText(slice.label, textDistance, 0);

        // Small subtext if jackpot
        if (slice.label.toLowerCase().includes("jackpot")) {
          ctx.font = `bold ${Math.max(9, fontSize - 4)}px sans-serif`;
          ctx.fillStyle = "#FEF08A";
          ctx.fillText("⭐ JACKPOT", textDistance, fontSize + 2);
        }

        ctx.restore();
      }

      ctx.restore(); // end wheel rotation

      // 3. Draw Center Hub / Button
      const hubRadius = radius * 0.24;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
      const hubGrad = ctx.createRadialGradient(
        centerX - 4,
        centerY - 4,
        2,
        centerX,
        centerY,
        hubRadius
      );
      hubGrad.addColorStop(0, "#FFFFFF");
      hubGrad.addColorStop(0.3, "#F3F4F6");
      hubGrad.addColorStop(0.8, "#E5E7EB");
      hubGrad.addColorStop(1, "#9CA3AF");
      ctx.fillStyle = hubGrad;
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fill();

      // Hub outer rim
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#4F46E5";
      ctx.stroke();

      // Hub inner decorative circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, hubRadius * 0.72, 0, 2 * Math.PI);
      ctx.fillStyle = "#4338CA";
      ctx.fill();

      // Hub text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.max(10, Math.floor(hubRadius * 0.45))}px 'Poppins', sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 2;
      ctx.fillText(centerButtonText, centerX, centerY);
      ctx.restore();

      // 4. Draw Top Pointer (Arrow pointing down at 12 o'clock)
      ctx.save();
      const pointerWidth = 22;
      const pointerLength = 26;
      const tipY = centerY - radius + 8;
      const baseTopY = tipY - pointerLength;

      ctx.beginPath();
      ctx.moveTo(centerX, tipY); // tip pointing down
      ctx.lineTo(centerX - pointerWidth / 2, baseTopY);
      ctx.lineTo(centerX + pointerWidth / 2, baseTopY);
      ctx.closePath();

      // Pointer gradient
      const ptrGrad = ctx.createLinearGradient(0, baseTopY, 0, tipY);
      ptrGrad.addColorStop(0, "#EF4444");
      ptrGrad.addColorStop(1, "#DC2626");
      ctx.fillStyle = ptrGrad;
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      // Pointer eyelet
      ctx.beginPath();
      ctx.arc(centerX, baseTopY + 8, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#FDE047";
      ctx.fill();

      ctx.restore();
      ctx.restore();
    },
    [displaySlices, size, totalSlices, sliceAngle, centerButtonText]
  );

  // Redraw whenever currentAngle or displaySlices changes
  useEffect(() => {
    drawWheel(currentAngle);
  }, [currentAngle, drawWheel]);

  // Handle programmatic or button spin
  const startSpinAnimation = useCallback(
    (wonIdx: number) => {
      if (isSpinningRef.current) return;
      isSpinningRef.current = true;

      // Pointer is at the top: 12 o'clock = -PI / 2 radians (or 3 * PI / 2).
      // A slice's center is at `(wonIdx + 0.5) * sliceAngle`.
      // When rotated by `R`, the angle under top pointer (-PI/2) satisfies:
      // (wonIdx + 0.5) * sliceAngle + R = -PI / 2 (mod 2PI)
      // => R = -PI / 2 - (wonIdx + 0.5) * sliceAngle
      const topPointerAngle = -Math.PI / 2;
      const sliceCenter = (wonIdx + 0.5) * sliceAngle;
      const targetBaseAngle = topPointerAngle - sliceCenter;

      // Add 5 to 7 full rotations for excitement
      const fullRotations = (5 + Math.floor(Math.random() * 2)) * (2 * Math.PI);
      const startAngle = currentAngle % (2 * Math.PI);
      const finalAngle = startAngle + fullRotations + ((targetBaseAngle - startAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

      const duration = 5200; // 5.2 seconds of suspense
      const startTime = performance.now();

      // Cubic ease-out deceleration curve
      const easeOut = (t: number): number => {
        return 1 - Math.pow(1 - t, 4);
      };

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOut(progress);

        const newAngle = startAngle + (finalAngle - startAngle) * eased;
        setCurrentAngle(newAngle);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          isSpinningRef.current = false;
          if (onSpinEnd) {
            onSpinEnd(displaySlices[wonIdx], wonIdx);
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [currentAngle, displaySlices, onSpinEnd, sliceAngle]
  );

  // Trigger spin when spinning prop becomes true with targetIndex
  useEffect(() => {
    if (spinning && targetIndex !== null && !isSpinningRef.current) {
      startSpinAnimation(targetIndex);
    }
  }, [spinning, targetIndex, startSpinAnimation]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (interactive && !spinning && !isSpinningRef.current && onStartSpin) {
      onStartSpin();
    }
  };

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={`rounded-full transition-transform ${
          interactive && !spinning ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""
        }`}
        title={interactive ? "ক্লিক করে স্পিন করুন" : "Spin Wheel Preview"}
      />
    </div>
  );
};
