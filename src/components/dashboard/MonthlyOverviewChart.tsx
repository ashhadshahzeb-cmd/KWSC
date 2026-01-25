import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

const data = [
  { month: "Jan", employees: 120, medicine: 230, hospital: 45, lab: 89 },
  { month: "Feb", employees: 145, medicine: 280, hospital: 52, lab: 95 },
  { month: "Mar", employees: 132, medicine: 245, hospital: 48, lab: 102 },
  { month: "Apr", employees: 158, medicine: 310, hospital: 61, lab: 115 },
  { month: "May", employees: 175, medicine: 340, hospital: 68, lab: 128 },
  { month: "Jun", employees: 168, medicine: 325, hospital: 72, lab: 135 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyOverviewChart = () => {
  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex items-center justify-between mb-10 px-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground tracking-tight">Analytics Overview</h3>
          </div>
          <p className="text-sm text-muted-foreground font-medium ml-13">System-wide performance metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-success bg-success/10 px-4 py-2 rounded-full border border-success/20 shadow-sm">
          <TrendingUp className="w-4 h-4" />
          +12.5%
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }} barGap={8}>
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="colorMedicine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="colorHospital" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="colorLab" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
              fontWeight={600}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
              fontWeight={600}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 10 }} />
            <Legend
              wrapperStyle={{ paddingTop: "30px" }}
              formatter={(value) => <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{value}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="employees" name="Patients" fill="url(#colorPatients)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="medicine" name="Medicine" fill="url(#colorMedicine)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="hospital" name="Hospital" fill="url(#colorHospital)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="lab" name="Lab" fill="url(#colorLab)" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyOverviewChart;
