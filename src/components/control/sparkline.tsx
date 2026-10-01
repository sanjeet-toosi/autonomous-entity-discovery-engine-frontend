"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function Sparkline({ points, color = "#35d07f" }: { points: { bucket: string; value: number }[]; color?: string }) {
  const data = points.map((p) => ({ t: new Date(p.bucket).getHours().toString().padStart(2, "0") + ":00", v: p.value }));
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <XAxis dataKey="t" hide />
          <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #2a3646", fontSize: 12 }} labelStyle={{ color: "#8b98a8" }} itemStyle={{ color }} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#spark)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
