"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Clock,
  User,
  Star,
  Video,
  Award,
  Users,
  ArrowRight,
  Filter,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 🎓 Dummy biotechnology & exam-oriented session data
const sessions = [
  {
    id: 1,
    title: "GATE-BT 2025 Crash Course",
    mentor: "Dr. Ananya Sharma",
    description:
      "Intensive preparation strategy for GATE Biotechnology with problem-solving sessions.",
    duration: "90 mins",
    price: 5999,
    discountPrice: 3999,
    currency: "INR",
    category: "Biotechnology",
    rating: 4.9,
    reviews: 127,
    availableSlots: ["Mon 10 AM", "Wed 2 PM", "Fri 6 PM"],
    sessionType: "One-on-One",
    experienceLevel: "Intermediate+",
    mentorExpertise: "AIR 12 GATE-BT, PhD Scholar IIT Roorkee",
  },
  {
    id: 2,
    title: "IIT JAM Life Sciences Guidance",
    mentor: "Ravi Kumar",
    description:
      "Step-by-step mentorship for cracking IIT JAM Life Sciences with smart revision techniques.",
    duration: "75 mins",
    price: 4999,
    discountPrice: 3499,
    currency: "INR",
    category: "Exams",
    rating: 4.8,
    reviews: 94,
    availableSlots: ["Tue 4 PM", "Thu 11 AM", "Sat 3 PM"],
    sessionType: "Group",
    experienceLevel: "All Levels",
    mentorExpertise: "IIT Roorkee Alumnus, JAM AIR 21",
  },
  {
    id: 3,
    title: "Biotech Career Roadmap",
    mentor: "Dr. Priya Nair",
    description:
      "Get career guidance on opportunities in Biotech research, industry, and abroad studies.",
    duration: "60 mins",
    price: 2999,
    discountPrice: 1999,
    currency: "INR",
    category: "Career",
    rating: 4.9,
    reviews: 83,
    availableSlots: ["Mon 3 PM", "Thu 5 PM", "Sun 11 AM"],
    sessionType: "One-on-One",
    experienceLevel: "All Levels",
    mentorExpertise: "Postdoc at Max Planck Institute, IIT Roorkee Graduate",
  },
  {
    id: 4,
    title: "Engineering Biology Concepts Simplified",
    mentor: "Aman Verma",
    description:
      "Clear your fundamentals in biotechnology & applied biology for exams and research.",
    duration: "120 mins",
    price: 3999,
    discountPrice: 2599,
    currency: "INR",
    category: "Engineering",
    rating: 4.7,
    reviews: 65,
    availableSlots: ["Tue 6 PM", "Fri 10 AM", "Sat 1 PM"],
    sessionType: "One-on-One",
    experienceLevel: "Beginner+",
    mentorExpertise: "MTech Biotechnology, IIT Delhi, Ex-IIT Roorkee Research Intern",
  },
  {
    id: 5,
    title: "Mock Interviews for Biotech Exams",
    mentor: "Dr. Kavita Rao",
    description:
      "Personalized mock interview practice for GATE-BT & IIT JAM with detailed feedback.",
    duration: "90 mins",
    price: 3499,
    discountPrice: 2299,
    currency: "INR",
    category: "Interview Prep",
    rating: 4.9,
    reviews: 51,
    availableSlots: ["Wed 4 PM", "Fri 5 PM", "Sun 9 AM"],
    sessionType: "One-on-One",
    experienceLevel: "Advanced",
    mentorExpertise: "GATE-BT AIR 8, Assistant Professor, IIT Roorkee",
  },
];

const categories = ["All", "Biotechnology", "Exams", "Career", "Engineering", "Interview Prep"];
const experienceLevels = ["All Levels", "Beginner+", "Intermediate+", "Advanced"];

export default function SessionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedExperience, setSelectedExperience] = useState("All Levels");
  const [sortBy, setSortBy] = useState("Recommended");

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.mentor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || session.category === selectedCategory;
    const matchesExperience =
      selectedExperience === "All Levels" ||
      session.experienceLevel === selectedExperience;
    return matchesSearch && matchesCategory && matchesExperience;
  });

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
          Book Expert Mentoring Sessions
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Learn directly from IIT experts and top rankers in Biotechnology, Engineering, and Exam Prep.
        </p>
      </div>

      {/* Search + Filters + Sort */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search sessions, mentors, or topics..."
            className="pl-10 pr-4 py-6 text-lg rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Sort by: {sortBy}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy("Recommended")}>Recommended</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("Price: Low to High")}>Price: Low to High</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("Price: High to Low")}>Price: High to Low</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("Top Rated")}>Top Rated</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map((session) => (
          <Card
            key={session.id}
            className="overflow-hidden flex flex-col h-full border border-purple-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <CardHeader className="pb-3 bg-gradient-to-r pt-4 from-purple-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {session.category}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-white dark:bg-gray-800">
                  <Video className="h-3 w-3" />
                  {session.sessionType}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold line-clamp-2">{session.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{session.description}</CardDescription>
            </CardHeader>

            <CardContent className="pb-3 flex-grow pt-5">
              {/* Mentor Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold">
                  {session.mentor.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-purple-700 dark:text-purple-300">{session.mentor}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{session.mentorExpertise}</p>
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4 text-cyan-500" />
                  <span>{session.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>{session.experienceLevel}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>{session.reviews} reviews</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>{session.rating}</span>
                </div>
              </div>

              {/* Slots */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Available slots this week:
                </p>
                <div className="flex flex-wrap gap-1">
                  {session.availableSlots.map((slot, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {slot}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <div className="w-full flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground line-through">
                    ₹{session.price.toLocaleString()}
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{session.discountPrice.toLocaleString()}{" "}
                    <Badge className="bg-amber-100 text-amber-700 ml-1 text-xs">
                      {Math.round(((session.price - session.discountPrice) / session.price) * 100)}% off
                    </Badge>
                  </p>
                </div>
                <Button className="rounded-full bg-amber-600 hover:bg-amber-700">
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Duration Options */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-6">Long-Term Guidance Packages</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {["3 Months", "6 Months", "12 Months"].map((plan, i) => (
            <div
              key={i}
              className="px-6 py-4 rounded-xl border border-purple-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-300">{plan}</p>
              <p className="text-sm text-muted-foreground">Personalized mentorship plan</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
