
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
  name: string;
  value: number;
}

interface DistributionPieChartProps {
  title: string;
  description: string;
  data: ChartData[];
}

const COLORS = ['#0F3E73', '#BB9C45', '#D4AF37', '#8B6914', '#5D4B15'];

const DistributionPieChart: React.FC<DistributionPieChartProps> = ({ title, description, data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} petições`, 'Quantidade']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>Não há dados suficientes para gerar este gráfico</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DistributionPieChart;
