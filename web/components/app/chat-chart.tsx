"use client";

import { useTheme } from "next-themes";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

import type { ChartData } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const ACCENT_LIGHT = "#3b5bdb";
const ACCENT_DARK = "#8da2ff";

// Single-hue ramp for pie slices so multi-category charts stay on-palette.
const PIE_ALPHAS = [0.9, 0.72, 0.56, 0.42, 0.3, 0.2];

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ChatChart({ chart }: { chart: ChartData }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const accent = dark ? ACCENT_DARK : ACCENT_LIGHT;
  const tick = dark ? "#9aa1af" : "#5c6270";
  const grid = dark ? "rgba(255,255,255,0.06)" : "rgba(35,38,46,0.08)";

  const type = chart.type ?? "bar";
  const isPie = type === "pie";

  const data = {
    labels: chart.labels,
    datasets: [
      {
        label: chart.title || "Data",
        data: chart.values,
        backgroundColor: isPie
          ? chart.values.map((_, i) =>
              hexToRgba(accent, PIE_ALPHAS[i % PIE_ALPHAS.length])
            )
          : hexToRgba(accent, 0.65),
        borderColor: accent,
        borderWidth: isPie ? 0 : 1.5,
        tension: 0.3,
        pointRadius: 3,
        borderRadius: type === "bar" ? 6 : 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: isPie,
        position: "bottom" as const,
        labels: { color: tick, boxWidth: 12, boxHeight: 12 },
      },
      tooltip: { padding: 10, cornerRadius: 8 },
    },
    scales: isPie
      ? undefined
      : {
          x: { ticks: { color: tick }, grid: { display: false } },
          y: { ticks: { color: tick }, grid: { color: grid } },
        },
  };

  return (
    <figure className="mt-3">
      {chart.title ? (
        <figcaption className="mb-2 text-xs font-medium text-muted-foreground">
          {chart.title}
        </figcaption>
      ) : null}
      <div className="relative h-72 w-full">
        {type === "line" ? (
          <Line data={data} options={options} />
        ) : isPie ? (
          <Pie data={data} options={options} />
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </figure>
  );
}
