import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Patients", value: 45, color: "hsl(217, 91%, 60%)" },
  { name: "Medicine", value: 30, color: "hsl(199, 89%, 48%)" },
  { name: "Hospital", value: 15, color: "hsl(142, 76%, 36%)" },
  { name: "Lab Tests", value: 10, color: "hsl(38, 92%, 50%)" },
];

const TodayActivityChart = () => {
  return (
    <div className="h-full flex flex-col p-2">
      <div className="mb-10 px-4">
        <h3 className="text-xl font-display font-bold text-foreground tracking-tight">Today's Distribution</h3>
        <p className="text-sm text-muted-foreground font-medium">Real-time activity breakdown</p>
      </div>

      <div className="flex-1 relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={8}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                />
              ))}
            </Pie>
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
              formatter={(value: number) => [`${value}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-3xl font-extrabold text-foreground tracking-tight">100%</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
        </div>
      </div>

      {/* Custom Premium Legend */}
      <div className="grid grid-cols-2 gap-4 mt-8 px-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-3 group cursor-pointer">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-lg group-hover:scale-125 transition-transform"
              style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                {item.name}
              </span>
              <span className="text-sm font-extrabold text-foreground">
                {item.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayActivityChart;
