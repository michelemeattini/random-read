import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Scienza e Tecnologia": "hsl(var(--category-science))",
  "Storia": "hsl(var(--category-history))",
  "Natura e Ambiente": "hsl(var(--category-nature))",
  "Spazio e Astronomia": "hsl(var(--category-space))",
  "Arte e Cultura": "hsl(var(--category-art))",
  "Geografia": "hsl(var(--category-culture))",
  "Biografie": "hsl(var(--category-technology))",
  "Altro": "hsl(var(--category-default))",
};

export const CategoryChart = ({ data }: CategoryChartProps) => {
  const chartData = data.slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-500">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Top 5 Categorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
              animationDuration={1500}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[entry.category] || "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};