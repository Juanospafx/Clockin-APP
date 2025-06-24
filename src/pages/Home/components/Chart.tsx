// src/pages/Home/components/Chart.tsx
import { useEffect, useState } from "react";
import { chartData } from "../../../lib/clockins";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  month: string;
  hours: number;
}

// Etiquetas para cada mes
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const Chart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>(
    months.map((m) => ({ month: m, hours: 0 }))
  );

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        console.warn("No user_id en localStorage");
        return;
      }
      try {
        const { data: res } = await chartData(userId);
        // Inicializamos un array con 0 horas
        const chartArray: ChartData[] = months.map((m) => ({
          month: m,
          hours: 0,
        }));
        // Rellenamos con los datos recibidos
        res.data.forEach(({ month, hours }) => {
          if (month >= 1 && month <= 12) {
            chartArray[month - 1].hours = Number(hours.toFixed(2));
          }
        });
        setData(chartArray);
      } catch (err) {
        console.error("Failed to fetch chart data", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="px-4 lg:px-16 py-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip formatter={(value: number) => `${value} hours`} />
            <Bar dataKey="hours" fill="#000000" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
