"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { create, all } from "mathjs";

// Configure math.js
const math = create(all, {
  number: "number",
  precision: 14
});

const ScientificCalculator = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const appendValue = (value: string) => {
    setInput((prev) => prev + value);
  };

  const handleButtonClick = (value: string) => {
    if (value === "=") {
      try {
        const evalResult = math.evaluate(
          input
            .replace(/π/g, "pi")
            .replace(/√/g, "sqrt")
            .replace(/\^/g, "**")
        );
        setResult(evalResult.toString());
      } catch (error) {
        setResult("Error");
      }
    } else if (value === "C") {
      setInput("");
      setResult("");
    } else if (value === "⌫") {
      setInput((prev) => prev.slice(0, -1));
    } else if (["sin", "cos", "tan", "log"].includes(value)) {
      appendValue(`${value}(`);
    } else {
      appendValue(value);
    }
  };

  const buttons = [
    "C", "⌫", "(", ")", 
    "7", "8", "9", "/", 
    "4", "5", "6", "*", 
    "1", "2", "3", "-", 
    "0", ".", "=", "+",
    "sin", "cos", "tan", "log",
    "π", "e", "^", "√"
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 w-full max-w-sm mx-auto border border-purple-200">
      {/* Display */}
      <div className="mb-4">
        <div className="bg-white p-3 rounded-t-lg border border-b-0 text-right text-lg font-mono h-12 overflow-x-auto shadow-inner">
          {input || "0"}
        </div>
        <div className="bg-gray-100 p-3 rounded-b-lg border text-right text-xl font-mono h-12 overflow-x-auto shadow-inner text-purple-700 font-bold">
          {result || "0"}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => {
          const isSpecial = ["=", "C", "⌫"].includes(btn);
          return (
            <Button
              key={btn}
              variant="outline"
              onClick={() => handleButtonClick(btn)}
              className={`h-12 font-mono rounded-lg transition-all duration-150 active:scale-95 shadow-sm ${
                isSpecial
                  ? "bg-purple-600 text-white hover:bg-purple-700 border-none"
                  : "border-purple-200 text-purple-800 hover:bg-purple-50"
              } ${
                ["sin", "cos", "tan", "log", "π", "e", "^", "√"].includes(btn)
                  ? "text-xs font-semibold"
                  : "text-base"
              }`}
            >
              {btn}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ScientificCalculator;
