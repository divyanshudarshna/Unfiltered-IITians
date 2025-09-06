"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category?: string;
};

export default function FAQPage() {
  const [faqData, setFaqData] = useState<
    { category: string; questions: Faq[] }[]
  >([]);
  const [activeItem, setActiveItem] = useState<string | null>("0-1");

  const toggleItem = (index: string) => {
    setActiveItem(activeItem === index ? null : index);
  };

  // Badge color styles per category
  const categoryColors: Record<string, string> = {
    "getting started":
      "text-emerald-700 bg-slate-700 border-emerald-500 dark:text-amber-400 dark:border-amber-200/20",
    courses:
      "text-violet-700 bg-slate-700 border-violet-500 dark:text-pink-400 dark:border-pink-200/20",
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/faq");
        const json = await res.json();

        // Always resolve to an array
        const data: Faq[] = Array.isArray(json)
          ? json
          : json.faqs || json.data || [];

        // Group by category
        const grouped: Record<string, Faq[]> = {};
        data.forEach((faq) => {
          const cat = faq.category?.toLowerCase() ?? "general";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(faq);
        });

        // Select only Getting Started & Courses
        const selectedCats = ["getting started", "courses"];
        const sections = selectedCats
          .map((cat) => ({
            category: cat,
            questions: grouped[cat]?.slice(0, 3) ?? [], // limit 3 per category
          }))
          .filter((s) => s.questions.length > 0);

        setFaqData(sections);
      } catch (err) {
        console.error("Failed to fetch FAQs", err);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-light-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-10 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col items-center gap-4 xl:max-w-[30%] xl:items-start">
            <span className="inline-flex items-center border-purple-400 border justify-center rounded-full bg-dark-500 px-3 py-1 text-light-300 text-sm font-medium">
              Find Answers to Common Queries
            </span>
            <h3 className="text-4xl lg:text-5xl font-bold text-center text-light-100 xl:text-left">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-center text-light-200 xl:text-left">
              Your path to clarity and understanding
            </p>

            {/* More FAQs button */}
            <Link
              href="/faqs"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400 px-6 py-2 text-cyan-400  hover:bg-slate-600 transition"
            >
              More FAQs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* FAQ Items */}
          <ul className="flex w-full flex-col gap-12 xl:max-w-[70%]">
            {faqData.map((section, sectionIndex) => (
              <li key={sectionIndex} className="flex flex-col gap-6">
                {/* Category badge */}
                <div className="flex items-center justify-center w-fit rounded-full bg-dark-700 px-3 py-1">
                  <p
                    className={`text-sm font-medium capitalize border rounded-full p-2 ${
                      categoryColors[section.category.toLowerCase()] ||
                      "text-light-300 border-light-400"
                    }`}
                  >
                    {section.category}
                  </p>
                </div>

                {/* Questions */}
                <div className="w-full space-y-5">
                  {section.questions.map((item, index) => {
                    const itemIndex = `${sectionIndex}-${index}`;
                    const isActive = activeItem === itemIndex;

                    return (
                      <div
                        key={index}
                        className="rounded-lg dark:bg-slate-900 bg-gray-200 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(itemIndex)}
                          className={`flex w-full justify-between items-center gap-5 p-6 ${
                            isActive ? "text-cyan-400" : "text-light-100"
                          }`}
                          aria-expanded={isActive}
                        >
                          <p className="flex-1 text-left text-lg font-semibold">
                            {item.question}
                          </p>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`flex-shrink-0 transition-transform duration-300 ${
                              isActive
                                ? "rotate-180 text-primary-400"
                                : "text-light-300"
                            }`}
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M14.0608 5.49999L13.5304 6.03032L8.70722 10.8535C8.3167 11.2441 7.68353 11.2441 7.29301 10.8535L2.46978 6.03032L1.93945 5.49999L3.00011 4.43933L3.53044 4.96966L8.00011 9.43933L12.4698 4.96966L13.0001 4.43933L14.0608 5.49999Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isActive
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="px-6 pb-6">
                            <p className="text-light-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
