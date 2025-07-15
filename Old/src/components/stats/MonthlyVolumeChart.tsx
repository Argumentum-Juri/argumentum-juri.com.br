
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthlyData {
  name: string;
  count: number;
}

interface MonthlyVolumeChartProps {
  data: MonthlyData[];
}

const MonthlyVolumeChart: React.FC<MonthlyVolumeChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume Mensal</CardTitle>
        <CardDescription>Petições solicitadas nos últimos meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#BB9C45" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyVolumeChart;
