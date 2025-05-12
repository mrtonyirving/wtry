import { Loader2, Check } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_STATES = [
  { message: "Evaluating Query", duration: 5000 },
  { message: "Gathering Information", duration: 5000 },
  { message: "Aggregating Information", duration: 5000 },
  { message: "Generating Answer", duration: Infinity },
];

export default function LoadingStates() {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [completedStates, setCompletedStates] = useState<number[]>([]);

  useEffect(() => {
    if (currentStateIndex >= LOADING_STATES.length - 1) return;

    const timer = setTimeout(() => {
      setCompletedStates((prev) => [...prev, currentStateIndex]);
      setCurrentStateIndex((prev) => prev + 1);
    }, LOADING_STATES[currentStateIndex].duration);

    return () => clearTimeout(timer);
  }, [currentStateIndex]);

  return (
    <div className="inline-block min-w-[400px] w-full rounded-lg transition-all duration-500 ease-in-out py-2">
      {LOADING_STATES.map((state, index) => (
        <div key={index} className="relative">
          <div
            className={`px-6 transition-all duration-300 ${
              index > currentStateIndex
                ? "h-0 opacity-0 overflow-hidden"
                : "h-[40px] opacity-100 flex items-center justify-start"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {completedStates.includes(index) ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <Loader2
                  className={`h-4 w-4 flex-shrink-0 ${
                    index === currentStateIndex ? "animate-spin" : ""
                  }`}
                />
              )}
              <span className="text-sm text-gray-500">{state.message}</span>
            </div>
          </div>
          {index < currentStateIndex && index < LOADING_STATES.length - 1 && (
            <div className="absolute left-8 top-[2.25rem] w-[1px] h-3 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
}
