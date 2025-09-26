"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  CheckCircle,
  Video,
  FileText,
  ChartLine,
  Smartphone,
  ArrowRight,
  FileText as FileTextIcon,
  Users,
  Target,
} from "lucide-react";
import Link from "next/link";
import { RouteMatcher } from "next/dist/server/route-matchers/route-matcher";
import { useRouter } from "next/navigation";
interface CourseDetail {
  id: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  durationMonths: number;
  details: CourseDetail[];
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/course-details/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to fetch course");
        }
        const data: Course = await res.json();
        setCourse(data);
      } catch (err: any) {
        console.error("Error fetching course:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-purple-500 mx-auto mb-4" />
          <span className="text-gray-300 text-lg">
            Loading course details...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-6 bg-red-900/20 border border-red-500/30 rounded-lg max-w-md">
          <p className="text-red-400 text-lg">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Course not found.</p>
        </div>
      </div>
    );
  }

  // Course highlights data
  const courseHighlights = [
    "Subject-wise detailed coverage",
    "120+ hours of video content",
    "Premium IIT-grade PDF materials",
    "8 full-length mock tests",
    "Previous 10 years' papers solved",
    "Shortcut techniques for problem-solving",
    "Regular doubt sessions",
  ];

  // Course features data - using available Lucide icons
  const courseFeatures = [
    {
      icon: Video,
      title: "120+ Video Lectures",
      description:
        "Comprehensive video lessons covering every topic with detailed explanations and visual aids.",
    },
    {
      icon: FileText,
      title: "Premium Study Material",
      description:
        "Downloadable PDF notes, formula sheets, and question banks specifically designed for preparation.",
    },
    {
      icon: Users,
      title: "Live Doubt Sessions",
      description:
        "Weekly live sessions to clear your doubts and get personalized guidance from instructors.",
    },
    {
      icon: Target,
      title: "Practice Tests",
      description:
        "Section-wise tests and full-length mock exams to track your progress and improve your speed.",
    },
    {
      icon: ChartLine,
      title: "Performance Analytics",
      description:
        "Detailed performance reports with insights on strengths, weaknesses, and improvement areas.",
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description:
        "Access course materials on any device - study anytime, anywhere at your own pace.",
    },
  ];

  // FAQ data
  const faqItems = [
    {
      question: "How long will I have access to the course materials?",
      answer:
        "You will have access to all course materials for 12 months from the date of enrollment. This includes all video lectures, reference PDFs, practice questions, and mock tests. You can also download certain materials for offline use.",
    },
    {
      question: "Are the mock tests similar to the actual exam?",
      answer:
        "Yes, all our mock tests are designed to simulate the actual exam environment. They follow the same pattern, difficulty level, and timing as the actual exam. Detailed performance analytics help you identify your strengths and weaknesses.",
    },
    {
      question: "Can I get personalized doubt clearing sessions?",
      answer:
        "Yes, we offer personalized doubt clearing sessions for students enrolled in our comprehensive courses. These sessions are conducted weekly, and you can schedule them based on your convenience.",
    },
    {
      question: "What if I'm not satisfied with the course?",
      answer:
        "We offer a 7-day money-back guarantee for all our courses. If you're not satisfied with the quality of the content, you can request a full refund within 7 days of enrollment.",
    },
    {
      question: "Is the course updated according to the latest syllabus?",
      answer:
        "Yes, all our course content is regularly updated to align with the latest syllabus and exam pattern. We monitor any changes in the examination patterns and update our content accordingly.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Title Card */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12 shadow-2xl shadow-purple-500/10">
            <h1 className="text-4xl lg:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-gray-300 text-lg lg:text-xl text-center max-w-4xl mx-auto leading-relaxed">
              {course.description ||
                "Targeted preparation focusing on exam pattern and high-yield topics."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Course Detail Card */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-600/10 border-2 border-purple-500/30 backdrop-blur-lg shadow-2xl shadow-purple-500/20 mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl lg:text-4xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {course.title} Preparation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-300 text-lg text-center max-w-4xl mx-auto leading-relaxed">
              This comprehensive course is designed to help you master all
              concepts required for the exam. With structured lessons, practice
              problems, and expert guidance, you'll be fully prepared to excel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {courseHighlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-200">{highlight}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold mb-4">
                {course.actualPrice && (
                  <span className="line-through text-gray-400 text-2xl mr-3">
                    ₹{course.price}
                  </span>
                )}
                <span className="bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                  ₹{course.actualPrice}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-emerald-400 hover:from-green-600 hover:bg-green-700 text-gray-900 font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-green-500/25 hover:translate-y-[-2px]">
                  Enroll Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 px-8 py-3 rounded-full backdrop-blur-sm"
                >
                  Try Free Mock Test <FileTextIcon className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold inline-block relative">
              Complete Syllabus Coverage
              <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            </h2>
          </div>

          {course.details.length === 0 ? (
            <Card className="bg-gray-900/50 backdrop-blur-lg border border-white/10 text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  No syllabus details added yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {course.details.map((detail, index) => (
                <AccordionItem
                  key={detail.id}
                  value={`item-${index}`}
                  className="bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="hover:bg-purple-500/10 px-6 py-4 text-lg font-semibold hover:no-underline">
                    {detail.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 my-4">
                    <div
                      className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: detail.description.replace(/\n/g, "<br/>"),
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold inline-block relative">
              Course Features
              <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-900/50 backdrop-blur-lg border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-purple-500/10 group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <feature.icon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-600/10 border border-purple-500/20 backdrop-blur-lg text-center py-12 mb-16">
          <CardContent>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Start Your Preparation Today
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Join our comprehensive course and get the expert guidance you need
              to ace your exam.
            </p>

            <Button 
  onClick={() => router.push(`/courses/${course.id}`)}
  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold  rounded-full shadow-lg transition-all duration-300 hover:shadow-purple-500/25 hover:translate-y-[-2px] text-sm px-4"
>
  Enroll Now! <ArrowRight className=" w-5 h-5" />
</Button>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold inline-block relative">
              Frequently Asked Questions
              <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="hover:bg-purple-500/10  px-6 py-4 text-lg font-semibold text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 my-4">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
