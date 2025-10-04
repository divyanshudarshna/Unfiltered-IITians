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
  const [isCalculated, setIsCalculated] = useState(false);

  // Convert degrees to radians for trigonometric functions
  const degToRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const appendValue = (value: string) => {
    if (isCalculated) {
      setInput(value);
      setIsCalculated(false);
    } else {
      setInput((prev) => prev + value);
    }
    setResult("");
  };

  const handleButtonClick = (value: string) => {
    if (value === "=") {
      calculateResult();
    } else if (value === "C") {
      clearAll();
    } else if (value === "⌫") {
      backspace();
    } else if (["sin", "cos", "tan", "log", "ln"].includes(value)) {
      handleFunction(value);
    } else if (value === "√") {
      handleSquareRoot();
    } else if (value === "^") {
      appendValue("^");
    } else if (value === "π") {
      appendValue("π");
    } else if (value === "e") {
      appendValue("e");
    } else {
      appendValue(value);
    }
  };

  const calculateResult = () => {
    if (!input.trim()) return;
    
    try {
      let expression = input;

      // Handle trigonometric functions with degree conversion
      expression = expression.replace(/sin\(([^)]+)\)/g, (match, angle) => {
        const num = math.evaluate(angle);
        return Math.sin(degToRad(num)).toString();
      });

      expression = expression.replace(/cos\(([^)]+)\)/g, (match, angle) => {
        const num = math.evaluate(angle);
        return Math.cos(degToRad(num)).toString();
      });

      expression = expression.replace(/tan\(([^)]+)\)/g, (match, angle) => {
        const num = math.evaluate(angle);
        return Math.tan(degToRad(num)).toString();
      });

      // Replace other symbols with math.js compatible functions
      expression = expression
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString())
        .replace(/√/g, "sqrt")
        .replace(/\^/g, "**")
        .replace(/ln/g, "log");

      // Handle implicit multiplication
      expression = expression.replace(/(\d)(?=\()/g, '$1*');
      expression = expression.replace(/(\d)(?=π)/g, '$1*');
      expression = expression.replace(/(\d)(?=e)/g, '$1*');
      expression = expression.replace(/\)(?=\()/g, ')*');
      expression = expression.replace(/\)(?=\d)/g, ')*');
      expression = expression.replace(/(π|e)(?=\d)/g, '$1*');

      const evalResult = math.evaluate(expression);
      setResult(evalResult.toString());
      setIsCalculated(true);
    } catch (error) {
      setResult("Error");
      setIsCalculated(false);
    }
  };

  const clearAll = () => {
    setInput("");
    setResult("");
    setIsCalculated(false);
  };

  const backspace = () => {
    setInput((prev) => prev.slice(0, -1));
    setResult("");
    setIsCalculated(false);
  };

  const handleFunction = (func: string) => {
    if (isCalculated) {
      setInput(`${func}(${result})`);
      setIsCalculated(false);
    } else {
      appendValue(`${func}(`);
    }
    setResult("");
  };

  const handleSquareRoot = () => {
    if (isCalculated) {
      setInput(`√(${result})`);
      setIsCalculated(false);
    } else {
      appendValue("√(");
    }
    setResult("");
  };

  const buttons = [
    "C", "⌫", "(", ")", 
    "7", "8", "9", "/", 
    "4", "5", "6", "*", 
    "1", "2", "3", "-", 
    "0", ".", "=", "+",
    "sin", "cos", "tan", "log",
    "π", "e", "^", "√",
    "ln"
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 w-full max-w-sm mx-auto border border-purple-200">
      {/* Display */}
      <div className="mb-4">
        <div className="bg-gray-100 text-black p-3 rounded-t-lg border border-b-0 text-right text-lg font-mono h-12 overflow-x-auto shadow-inner flex items-center justify-end">
          <span className={input ? "text-gray-800" : "text-gray-400"}>
            {input || "0"}
          </span>
        </div>
        <div className="bg-gray-100 p-3 rounded-b-lg border text-right text-xl font-mono h-12 overflow-x-auto shadow-inner flex items-center justify-end text-purple-700 font-bold">
          {result || "0"}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => {
          const isSpecial = ["=", "C", "⌫"].includes(btn);
          const isScientific = ["sin", "cos", "tan", "log", "ln", "π", "e", "^", "√"].includes(btn);
          
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
                isScientific
                  ? "text-xs font-semibold"
                  : "text-base"
              } ${
                btn === "=" ? "bg-green-600 hover:bg-green-700" : ""
              } ${
                btn === "C" || btn === "⌫" ? "bg-red-500 hover:bg-red-600" : ""
              }`}
            >
              {btn}
            </Button>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-600 text-center">
        <p>Trigonometric functions use degrees</p>
        <p>Example: sin(90) = 1, cos(0) = 1</p>
      </div>
    </div>
  );
};

export default ScientificCalculator;