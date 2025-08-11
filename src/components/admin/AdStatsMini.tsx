import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from "recharts";

interface Props { adId: string }

export default function AdStatsMini({ adId }: Props) {
  const [data, setData] = useState<{ day: string; imps: number; clicks: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 13);
      const sinceStr = since.toISOString();
      const { data: logs } = await supabase
        .from("ad_logs")
        .select("type, created_at")
        .eq("ad_id", adId)
        .gte("created_at", sinceStr)
        .order("created_at", { ascending: true });

      const days: Record<string, { imps: number; clicks: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        days[key] = { imps: 0, clicks: 0 };
      }
      (logs || []).forEach((l: any) => {
        const key = new Date(l.created_at).toISOString().slice(0, 10);
        if (!days[key]) days[key] = { imps: 0, clicks: 0 };
        if (l.type === "impression") days[key].imps++;
        else if (l.type === "click") days[key].clicks++;
      });
      setData(Object.entries(days).map(([day, v]) => ({ day: day.slice(5), imps: v.imps, clicks: v.clicks })));
    };
    load();
  }, [adId]);

  return (
    <div className="w-full h-24">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="imps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <YAxis hide />
          <Tooltip cursor={false} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Area type="monotone" dataKey="imps" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#imps)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
