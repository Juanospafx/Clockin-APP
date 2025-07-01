// src/pages/Home/components/SummaryCards.tsx
import { useEffect, useState } from "react";
import { getMe } from "../../../lib/users";
import { getSummaryAll, getSummaryForUser } from "../../../lib/summary";

interface SummaryData {
  week: number;
  month: number;
  total: number;
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
      try {
        const me = await getMe(token);
        if (me.role === "admin") {
          setIsAdmin(true);
          const summaryData = await getSummaryAll(token);
          setSummary(summaryData);
        } else {
          setIsAdmin(false);
          const summaryData = await getSummaryForUser(token, userId);
          setSummary(summaryData);
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
