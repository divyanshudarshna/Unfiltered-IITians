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
  BookOpen,
  Download,
  FileText,
  Video,
  Search,
  Filter,
  ArrowRight,
  Bookmark,
  FileCode,
  FileSpreadsheet,
  FileType,
  FileImage,
  FileAudio,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";

import FAQPage from "@/components/faq";
// Dummy resource data
const resources = [
  {
    id: 1,
    title: "Complete JavaScript Guide",
    description: "A comprehensive guide to JavaScript fundamentals, ES6 features, and advanced concepts.",
    type: "PDF",
    category: "Programming",
    fileSize: "4.2 MB",
    pages: 120,
    downloadLink: "#",
    author: "Web Dev Academy",
    uploadDate: "2023-10-15",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Data Structures & Algorithms",
    description: "Essential data structures and algorithms with implementation examples in multiple languages.",
    type: "PDF",
    category: "Computer Science",
    fileSize: "6.7 MB",
    pages: 210,
    downloadLink: "#",
    author: "CS University",
    uploadDate: "2023-09-22",
    rating: 4.9,
  },
  {
    id: 3,
    title: "React.js Crash Course",
    description: "Video series covering React fundamentals, hooks, state management and more.",
    type: "Video",
    category: "Web Development",
    fileSize: "1.2 GB",
    duration: "4h 32m",
    downloadLink: "#",
    author: "Frontend Masters",
    uploadDate: "2023-11-05",
    rating: 4.7,
  },
  {
    id: 4,
    title: "Machine Learning Cheat Sheet",
    description: "Quick reference for common ML algorithms, formulas, and concepts.",
    type: "PDF",
    category: "Data Science",
    fileSize: "2.1 MB",
    pages: 45,
    downloadLink: "#",
    author: "AI Research Lab",
    uploadDate: "2023-08-30",
    rating: 4.6,
  },
  {
    id: 5,
    title: "UI/UX Design Principles",
    description: "Comprehensive guide to modern UI/UX design principles and best practices.",
    type: "PDF",
    category: "Design",
    fileSize: "5.3 MB",
    pages: 95,
    downloadLink: "#",
    author: "Design Collective",
    uploadDate: "2023-10-28",
    rating: 4.5,
  },
  {
    id: 6,
    title: "Python for Data Analysis",
    description: "Notebook with examples of data analysis using Pandas, NumPy, and Matplotlib.",
    type: "Jupyter Notebook",
    category: "Data Science",
    fileSize: "3.8 MB",
    downloadLink: "#",
    author: "Data Science Hub",
    uploadDate: "2023-11-12",
    rating: 4.7,
  },
  {
    id: 7,
    title: "Web Security Fundamentals",
    description: "Learn about common web vulnerabilities and how to protect against them.",
    type: "PDF",
    category: "Cybersecurity",
    fileSize: "4.9 MB",
    pages: 110,
    downloadLink: "#",
    author: "Security Experts",
    uploadDate: "2023-09-15",
    rating: 4.8,
  },
  {
    id: 8,
    title: "Advanced CSS Techniques",
    description: "Video tutorial covering advanced CSS layouts, animations, and responsive design.",
    type: "Video",
    category: "Web Development",
    fileSize: "850 MB",
    duration: "3h 15m",
    downloadLink: "#",
    author: "CSS Masters",
    uploadDate: "2023-11-08",
    rating: 4.6,
  },
];

const categories = [
  "All",
  "Programming",
  "Web Development",
  "Data Science",
  "Design",
  "Computer Science",
  "Cybersecurity",
];

const resourceTypes = [
  "All",
  "PDF",
  "Video",
  "Jupyter Notebook",
  "Code",
  "Image",
  "Audio",
];

// Icon mapping based on resource type
const getIconByType = (type: string) => {
  switch (type) {
    case "PDF":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "Video":
      return <Video className="h-5 w-5 text-purple-500" />;
    case "Jupyter Notebook":
      return <FileCode className="h-5 w-5 text-orange-500" />;
    case "Code":
      return <FileCode className="h-5 w-5 text-blue-500" />;
    case "Image":
      return <FileImage className="h-5 w-5 text-green-500" />;
    case "Audio":
      return <FileAudio className="h-5 w-5 text-yellow-500" />;
    default:
      return <FileType className="h-5 w-5 text-gray-500" />;
  }
};

export default function FreeResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    const matchesType = selectedType === "All" || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <>
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Free Learning Resources
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Discover high-quality free resources to boost your skills and knowledge. Download PDFs, videos, and more.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search resources..."
            className="pl-10 pr-4 py-6 text-lg rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Category</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 rounded-lg"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileType className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Resource Type</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resourceTypes.map((type) => (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 rounded-lg"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getIconByType(resource.type)}
                    {resource.type}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200">
                    {resource.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl line-clamp-2">{resource.title}</CardTitle>
                <CardDescription className="line-clamp-3 mt-2">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3 flex-grow">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{resource.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{resource.uploadDate}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">{resource.fileSize}</span>
                    {"pages" in resource && <span> • {resource.pages} pages</span>}
                    {"duration" in resource && <span> • {resource.duration}</span>}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <span className="font-medium">{resource.rating}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Download className="mr-2 h-4 w-4" />
                  Download Resource
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center py-12">
          <div className="bg-muted p-6 rounded-full mb-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Resources Found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== "All" || selectedType !== "All"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "No resources available at the moment. Check back later!"}
          </p>
          {(searchQuery || selectedCategory !== "All" || selectedType !== "All") && (
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedType("All");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Want to contribute resources?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Share your knowledge with the community by uploading educational materials, study guides, or helpful resources.
        </p>
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Submit a Resource <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>

    <FAQPage categories={["materials"]}/>
</>

  );
}