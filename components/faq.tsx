'use client';

import { useState } from 'react';

const FAQPage = () => {
  const [activeItem, setActiveItem] = useState('0-1'); // Second question active by default

  const toggleItem = (index) => {
    setActiveItem(activeItem === index ? null : index);
  };

  const faqData = [
    {
      category: "getting started",
      color: "text-warning-900",
      
      questions: [
        {
          question: "What should I know before I join the platform?",
          answer: "Our learning paths are tailored to your knowledge and skills. You can be an experienced programmer, or just starting out - your learning path will lead you from where you are now to the JavaScript Mastery."
        },
        {
          question: "I'm already an experienced programmer. What can you offer me?",
          answer: "Even if you mastered web development already, you'll find a ton of learning materials and tips regarding webdev and coding in general - there surely is something new for you to learn. Additionally, we keep our materials up to date, so our platform can be a good source for you to learn new things after big changes to your favourite technologies."
        },
        {
          question: "How is this different than your YouTube videos?",
          answer: "Our platform offers structured learning paths, in-depth courses, exercises, and community support that go beyond what's possible in YouTube videos. You'll get a comprehensive curriculum rather than isolated tutorials."
        },
        {
          question: "If I have a lower tier, can I upgrade later?",
          answer: "Yes, you can upgrade your subscription at any time. The upgrade will be prorated based on the time remaining in your current billing cycle."
        },
        {
          question: "Can I stop the payments for some time, and return later?",
          answer: "Absolutely. You can pause your subscription anytime and resume when you're ready to continue learning. Your progress will be saved."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-light-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-10 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col items-center gap-4 xl:max-w-[30%] xl:items-start">
            <span className="inline-flex items-center border-cyan-400 border-1 border-r  justify-center rounded-full bg-dark-500 px-3 py-1 text-light-300 text-sm font-medium">
              Find Answers to Common Queries
            </span>
            <h3 className="text-4xl lg:text-5xl font-bold text-center text-light-100 xl:text-left">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-center text-light-200 xl:text-left">
              Your path to clarity and understanding
            </p>
          </div>
          
          {/* FAQ Items */}
          <ul className="flex w-full flex-col gap-12 xl:max-w-[70%]">
            {faqData.map((section, sectionIndex) => (
              <li key={sectionIndex} className="flex flex-col gap-6">
                <div className="flex items-center justify-center w-fit rounded-full bg-dark-700 px-3 py-1">
                  <p className="text-sm font-medium capitalize dark:bg-slate-800 text-emerald-700 border-emerald-500 dark:border-amber-200/20  dark:text-amber-400 border-r border-1 rounded-full p-2 ">
                    {section.category}
                  </p>
                </div>
                
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
                          className={`flex w-full justify-between items-center gap-5 p-6 ${isActive ? 'text-cyan-400' : 'text-light-100'}`}
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
                            className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'rotate-180 text-primary-400' : 'text-light-300'}`}
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
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
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
};

export default FAQPage;