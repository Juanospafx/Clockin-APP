import React from "react";
import { endClockin } from "../../../lib/clockins";

interface ClockOutProps {
  token: string;
  clockinId: string;
  onCompleted: () => void;
}

const ClockOut: React.FC<ClockOutProps> = ({ token, clockinId, onCompleted }) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClockOut = async () => {
    if (!clockinId) return alert("No hay clockin activo");
    
    try {
      setIsProcessing(true);
      // URL CORREGIDA: /clockins/end/{id}
      await endClockin(token, clockinId, {});
      localStorage.removeItem("clockinSession");
      onCompleted();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        alert(err.message || "Error finalizando clockin");
      } else {
        alert("An unknown error occurred");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClockOut}
      disabled={isProcessing}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {isProcessing ? "Processing..." : "Clock Out"}
    </button>
  );
};

export default ClockOut;