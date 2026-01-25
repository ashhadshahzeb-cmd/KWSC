import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const data = [
  { month: "Jan", patients: 420, visits: 680 },
  { month: "Feb", patients: 480, visits: 720 },
  { month: "Mar", patients: 510, visits: 780 },
  { month: "Apr", patients: 560, visits: 850 },
  { month: "May", patients: 620, visits: 920 },
  { month: "Jun", patients: 680, visits: 980 },
  { month: "Jul", patients: 720, visits: 1050 },
  { month: "Aug", patients: 750, visits: 1100 },
  { month: "Sep", patients: 790, visits: 1150 },
  { month: "Oct", patients: 840, visits: 1220 },
  { month: "Nov", patients: 890, visits: 1280 },
  { month: "Dec", patients: 950, visits: 1350 },
];

const YearlyTrendChart = () => {
  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex items-center justify-between mb-10 px-4">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground tracking-tight">Growth Trajectory</h3>
          <p className="text-sm text-muted-foreground font-medium">Year-over-year patient registration trend</p>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Patients</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Visits</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPatientsLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVisitsLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              fontWeight={600}
              dy={10}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              fontWeight={600}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                boxShadow: "0 20px 50px -12px rgba(0,0,0,0.15)",
                padding: "12px"
              }}
              itemStyle={{ fontWeight: 700, fontSize: '13px' }}
              labelStyle={{ fontWeight: 800, marginBottom: '8px', color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="patients"
              name="Patients"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorPatientsLine)"
            />
            <Area
              type="monotone"
              dataKey="visits"
              name="Visits"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorVisitsLine)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YearlyTrendChart;
