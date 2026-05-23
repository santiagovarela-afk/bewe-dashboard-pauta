"use client";
import * as React from "react";
import { motion } from "motion/react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  fill?: boolean;
}

export function Sparkline({
  data,
  color = "currentColor",
  height = 28,
  className,
  fill = true,
}: SparklineProps) {
  const width = 80;
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return [x, y] as const;
    });

  const linePath =
    "M " +
    points
      .map(([x, y], i, arr) => {
        if (i === 0) return `${x},${y}`;
        const [px, py] = arr[i - 1];
        const cx = (px + x) / 2;
        return `Q ${cx},${py} ${(cx + x) / 2},${(py + y) / 2} T ${x},${y}`;
      })
      .join(" ");

  const fillPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
    >
      {fill && (
        <motion.path
          d={fillPath}
          fill={color}
          opacity={0.18}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ duration: 0.8 }}
        />
      )}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
    </svg>
  );
}
