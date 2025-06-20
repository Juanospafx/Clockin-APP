// src/pages/Home/components/SummaryCards.tsx
import { useEffect, useState } from "react";
import axios from "axios";

interface SummaryData {
  week: number;
  month: number;
  total: number;
}

interface MeResponse {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  user_type?: "field" | "office";
}

const SummaryCards: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData>({
    week: 0,
    month: 0,
    total: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchSummary = async () => {
      if (!token || !userId) return;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // 1) Saber rol de quien está autenticado
        const meRes = await axios.get<MeResponse>(
          "http://localhost:8000/users/me",
          { headers }
        );

        if (meRes.data.role === "admin") {
          setIsAdmin(true);
          // 2a) Si es admin, pedimos el endpoint /summary/all
          const respAll = await axios.get<SummaryData>(
            "http://localhost:8000/summary/all",
            { headers }
          );
          setSummary(respAll.data);
        } else {
          setIsAdmin(false);
          // 2b) Si no es admin, pedimos /summary/{userId}
          const respUser = await axios.get<SummaryData>(
            `http://localhost:8000/summary/${userId}`,
            { headers }
          );
          setSummary(respUser.data);
        }
      } catch (err) {
        console.error("Failed to fetch summary data", err);
      }
    };

    fetchSummary();
  }, [token, userId]);

  return (
    <div className="px-4 lg:px-16 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card “Hours worked per week” */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h3 className="font-semibold mb-2">
            {isAdmin ? "Total hours/week (all users)" : "Hours worked per week"}
          </h3>
          <p className="text-4xl font-bold">{summary.week.toFixed(2)}</p>
          <p className="text-gray-500">hours</p>
        </div>

        {/* Card “Hours worked per month” */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h3 className="font-semibold mb-2">
            {isAdmin
              ? "Total hours/month (all users)"
              : "Hours worked per month"}
          </h3>
          <p className="text-4xl font-bold">{summary.month.toFixed(2)}</p>
          <p className="text-gray-500">hours</p>
        </div>

        {/* Card “Total hours worked” */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h3 className="font-semibold mb-2">
            {isAdmin ? "Total hours (all users)" : "Total hours worked"}
          </h3>
          <p className="text-4xl font-bold">{summary.total.toFixed(2)}</p>
          <p className="text-gray-500">hours</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
