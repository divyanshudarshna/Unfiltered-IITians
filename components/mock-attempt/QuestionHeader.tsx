import { Clock } from "lucide-react";

export default function QuestionHeader({ title, description, timeLeft, sections }) {
  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="flex justify-between items-center bg-white shadow p-4 rounded mb-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-gray-500">{description}</p>
        <div className="mt-2 flex gap-2">
          {sections.map(sec => (
            <span key={sec} className="px-3 py-1 text-white rounded-full text-sm"
              style={{ backgroundColor: sec.includes("MCQ") ? "#9333ea" : sec.includes("MSQ") ? "#dc2626" : "#2563eb" }}>
              {sec}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded shadow">
        <Clock className="w-5 h-5" />
        {hours}:{minutes}:{seconds}
      </div>
    </div>
  );
}
