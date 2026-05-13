"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  GraduationCap,
  Globe,
  Linkedin,
  Twitter,
  FlaskConical,
  BookOpen,
  Award,
} from "lucide-react";

interface AcademicAffiliation {
  institution: string;
  role?: string;
  year?: string;
  logoUrl?: string;
}

interface ResearchAppointment {
  organization: string;
  role?: string;
  period?: string;
}

interface InstructorSocialLinks {
  website?: string;
  linkedin?: string;
  researchgate?: string;
  twitter?: string;
}

interface Instructor {
  id: string;
  fullName: string;
  title?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  expertiseAreas?: string[];
  awards?: string | null;
  academicAffiliations?: AcademicAffiliation[];
  researchAppointments?: ResearchAppointment[];
  socialLinks?: InstructorSocialLinks | null;
}

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
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const [detailsRes, courseRes] = await Promise.all([
          fetch(`/api/course-details/${id}`),
          fetch(`/api/courses/${id}`),
        ]);
        if (!detailsRes.ok) {
          const errData = await detailsRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to fetch course");
        }
        const data: Course = await detailsRes.json();
        setCourse(data);
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setInstructors(courseData.instructors || []);
        }
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
      <div className="flex justify-center items-center min-h-96 bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-purple-500 mx-auto mb-4" />
          <span className="text-gray-600 dark:text-gray-300 text-lg">
            Loading course details...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96 bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg max-w-md">
          <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
          <Button
            onClick={() => globalThis.location.reload()}
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
      <div className="flex justify-center items-center min-h-96 bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Course not found.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Title Card */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8 lg:p-12 shadow-xl shadow-gray-200 dark:shadow-2xl dark:shadow-purple-500/10">
            <h1 className="text-4xl lg:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg lg:text-xl text-center max-w-4xl mx-auto leading-relaxed">
              {course.description ||
                "Targeted preparation focusing on exam pattern and high-yield topics."}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Course Detail Card */}
        <Card className="dark:bg-gradient-to-br dark:from-primary/30 dark:to-purple-700/10 border-2 border-purple-200 dark:border-purple-500/30 backdrop-blur-lg shadow-xl shadow-purple-100/80 dark:shadow-2xl dark:shadow-purple-500/20 mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl lg:text-4xl bg-gradient-to-r from-gray-900 to-purple-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {course.title} Preparation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 text-lg text-center max-w-4xl mx-auto leading-relaxed">
              This comprehensive course is designed to help you master all
              concepts required for the exam. With structured lessons, practice
              problems, and expert guidance, you'll be fully prepared to excel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {courseHighlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200">{highlight}</span>
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
                <span className="bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                  ₹{course.actualPrice}
                </span>
              </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
  <Button
    onClick={() => router.push(`/courses/${course.id}`)}
    className="bg-emerald-500 hover:from-green-600 hover:bg-green-700 text-gray-900 font-semibold text-lg px-10 py-5 rounded-full shadow-xl transition-all duration-300 hover:shadow-green-500/30 hover:translate-y-[-3px]"
  >
    Enroll Now <ArrowRight className="ml-3 w-5 h-5" />
  </Button>

  <Button
    onClick={() => router.push("/mocks")}
    variant="outline"
    className="border-purple-500/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-500/10 hover:text-purple-800 dark:hover:text-purple-200 text-lg px-10 py-4 rounded-full backdrop-blur-md"
  >
    Try Free Mock Test <FileTextIcon className="ml-3 w-5 h-5" />
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
            <Card className="bg-white dark:bg-gray-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/10 text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
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
                  className="bg-white dark:bg-gray-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="hover:bg-purple-100/60 dark:hover:bg-purple-500/10 px-6 py-4 text-lg font-semibold hover:no-underline text-gray-900 dark:text-white">
                    {detail.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 my-4">
                    <div
                      className="text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: detail.description.replaceAll("\n", "<br/>"),
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        {/* ── Instructor Profiles ── */}
        {instructors.length > 0 && (
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold inline-block relative">
                {instructors.length === 1 ? "Meet Your Instructor" : "Meet Your Instructors"}
                <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              </h2>
            </div>

            <div className="space-y-6">
              {instructors.map((instructor) => {
                const affiliations = (instructor.academicAffiliations || []) as AcademicAffiliation[];
                const appointments = (instructor.researchAppointments || []) as ResearchAppointment[];
                const social = instructor.socialLinks as InstructorSocialLinks | null;

                return (
                  <div
                    key={instructor.id}
                    className="bg-white dark:bg-gray-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg shadow-gray-100 dark:shadow-purple-500/5"
                  >
                    {/* Purple top strip */}
                    <div className="h-1.5 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-500" />

                    <div className="p-8 space-y-6">
                      {/* Avatar + name + title + socials */}
                      <div className="flex items-start gap-6">
                        {instructor.profileImageUrl ? (
                          <img
                            src={instructor.profileImageUrl}
                            alt={instructor.fullName}
                            className="h-24 w-24 rounded-full object-cover flex-shrink-0 border-2 border-purple-300 dark:border-purple-600/60 shadow-md"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-3xl font-bold shadow-md">
                            {instructor.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            {instructor.fullName}
                          </h3>
                          {instructor.title && (
                            <p className="text-base text-purple-600 dark:text-purple-400 font-medium mt-1">
                              {instructor.title}
                            </p>
                          )}
                          {social && (
                            <div className="flex items-center gap-4 mt-3">
                              {social.website && (
                                <a href={social.website} target="_blank" rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" title="Website">
                                  <Globe className="h-5 w-5" />
                                </a>
                              )}
                              {social.linkedin && (
                                <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" title="LinkedIn">
                                  <Linkedin className="h-5 w-5" />
                                </a>
                              )}
                              {social.researchgate && (
                                <a href={social.researchgate} target="_blank" rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" title="ResearchGate">
                                  <FlaskConical className="h-5 w-5" />
                                </a>
                              )}
                              {social.twitter && (
                                <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" title="Twitter / X">
                                  <Twitter className="h-5 w-5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      {instructor.bio && (
                        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed border-l-2 border-purple-400 dark:border-purple-600 pl-4">
                          {instructor.bio}
                        </p>
                      )}

                      {/* Expertise chips */}
                      {instructor.expertiseAreas && instructor.expertiseAreas.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-purple-500" /> Expertise
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {instructor.expertiseAreas.map((area, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-sm px-3 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-0"
                              >
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Affiliations + Research side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {affiliations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-purple-500" /> Academic Background
                            </h4>
                            <div className="space-y-2">
                              {affiliations.map((aff, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                  {aff.logoUrl ? (
                                    <img
                                      src={aff.logoUrl}
                                      alt={aff.institution}
                                      className="h-9 w-9 object-contain flex-shrink-0 rounded"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                      <GraduationCap className="h-4 w-4 text-purple-500" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                                      {aff.institution}
                                    </span>
                                    {(aff.role || aff.year) && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {[aff.role, aff.year].filter(Boolean).join(" · ")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {appointments.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-purple-500" /> Research &amp; Appointments
                            </h4>
                            <div className="space-y-2">
                              {appointments.map((apt, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm py-1">
                                  <span className="text-purple-500 mt-1 flex-shrink-0">•</span>
                                  <span className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium text-gray-900 dark:text-white">{apt.organization}</span>
                                    {apt.role && <> — {apt.role}</>}
                                    {apt.period && <span className="text-xs ml-1 text-gray-400">({apt.period})</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Awards */}
                      {instructor.awards && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4 text-purple-500" /> Awards &amp; Recognition
                          </h4>
                          <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {instructor.awards}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold inline-block relative">
              Course Features
              <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="bg-white dark:bg-gray-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/30 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-purple-100 dark:hover:shadow-purple-500/10 group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <feature.icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-600/10 border border-purple-200 dark:border-purple-500/20 backdrop-blur-lg text-center py-12 mb-16">
          <CardContent>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-purple-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Start Your Preparation Today
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Join our comprehensive course and get the expert guidance you need
              to ace your exam.
            </p>

     <Button
  onClick={() => router.push(`/courses/${course.id}`)}
  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-full shadow-xl transition-all duration-300 hover:shadow-purple-500/30 hover:translate-y-[-3px] text-lg px-10 py-5"
>
  Enroll Now! <ArrowRight className="ml-3 w-8 h-8" />
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
            {faqItems.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className="bg-white dark:bg-gray-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="hover:bg-purple-100/60 dark:hover:bg-purple-500/10 px-6 py-4 text-lg font-semibold text-left hover:no-underline text-gray-900 dark:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 my-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </div>
  );
}
