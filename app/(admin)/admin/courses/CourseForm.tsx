"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  BookOpen, 
  DollarSign, 
  Calendar, 
  FileText, 
  Tag,
  Save,
  Loader2,
  Package,
  CheckCircle,
  Circle,
  Plus,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CourseFormProps {
  onSuccess: () => void;
  course?: any; // optional for editing
}

enum PublishStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

// ✅ Interface for inclusion options
interface InclusionOption {
  id: string;
  title: string;
  description?: string;
  price: number;
  type: 'MOCK_TEST' | 'MOCK_BUNDLE' | 'SESSION';
  difficulty?: string;
  mockCount?: number;
  sessionType?: string;
  duration?: number;
}

interface InclusionData {
  mockTests: InclusionOption[];
  mockBundles: InclusionOption[];
  sessions: InclusionOption[];
}

export default function CourseForm({ onSuccess, course }: CourseFormProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    actualPrice: "",
    durationMonths: "",
    status: PublishStatus.DRAFT,
    order: "",
  });

  // ✅ State for inclusions
  const [selectedInclusions, setSelectedInclusions] = useState<{
    mockTests: string[];
    mockBundles: string[];
    sessions: string[];
  }>({
    mockTests: [],
    mockBundles: [],
    sessions: []
  });

  const [inclusionOptions, setInclusionOptions] = useState<InclusionData>({
    mockTests: [],
    mockBundles: [],
    sessions: []
  });

  const [loading, setLoading] = useState(false);
  const [loadingInclusions, setLoadingInclusions] = useState(true);

  // ✅ Fetch inclusion options
  useEffect(() => {
    const fetchInclusionOptions = async () => {
      try {
        setLoadingInclusions(true);
        const response = await fetch('/api/admin/courses/inclusion-options');
        if (response.ok) {
          const data = await response.json();
          setInclusionOptions(data);
        }
      } catch (error) {
        console.error('Failed to fetch inclusion options:', error);
        toast.error('Failed to load inclusion options');
      } finally {
        setLoadingInclusions(false);
      }
    };

    fetchInclusionOptions();
  }, []);

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        description: course.description || "",
        price: course.price?.toString() || "",
        actualPrice: course.actualPrice?.toString() || "",
        durationMonths: course.durationMonths?.toString() || "",
        status: course.status || PublishStatus.DRAFT,
        order: course.order?.toString() || "",
      });

      // ✅ Set existing inclusions if editing
      if (course.inclusions && Array.isArray(course.inclusions)) {
        const mockTests = course.inclusions
          .filter((inc: any) => inc.inclusionType === 'MOCK_TEST')
          .map((inc: any) => inc.inclusionId);
        const mockBundles = course.inclusions
          .filter((inc: any) => inc.inclusionType === 'MOCK_BUNDLE')
          .map((inc: any) => inc.inclusionId);
        const sessions = course.inclusions
          .filter((inc: any) => inc.inclusionType === 'SESSION')
          .map((inc: any) => inc.inclusionId);

        setSelectedInclusions({ mockTests, mockBundles, sessions });
      }
    }
  }, [course]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    setForm({ ...form, status: value as PublishStatus });
  };

  // ✅ Handle inclusion selection
  const handleInclusionToggle = (type: 'mockTests' | 'mockBundles' | 'sessions', id: string) => {
    setSelectedInclusions(prev => {
      const currentIds = prev[type];
      const isSelected = currentIds.includes(id);
      
      if (isSelected) {
        return {
          ...prev,
          [type]: currentIds.filter(currentId => currentId !== id)
        };
      } else {
        return {
          ...prev,
          [type]: [...currentIds, id]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = course ? "PUT" : "POST";
      const url = course ? `/api/admin/courses/${course.id}` : "/api/admin/courses";

      // ✅ Prepare inclusions data
      const inclusions = [
        ...selectedInclusions.mockTests.map(id => ({ type: 'MOCK_TEST', id })),
        ...selectedInclusions.mockBundles.map(id => ({ type: 'MOCK_BUNDLE', id })),
        ...selectedInclusions.sessions.map(id => ({ type: 'SESSION', id })),
      ];
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: Number(form.price),
          actualPrice: Number(form.actualPrice),
          durationMonths: Number(form.durationMonths),
          status: form.status,
          order: form.order ? Number(form.order) : undefined,
          inclusions: inclusions, // ✅ Send inclusions data
        }),
      });

      if (!res.ok) throw new Error("Failed to save course");

      toast.success(course ? "Course updated successfully!" : "Course created successfully!");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error saving course");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PublishStatus) => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
      case PublishStatus.DRAFT:
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400";
      case PublishStatus.ARCHIVED:
        return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusText = (status: PublishStatus) => {
    switch (status) {
      case PublishStatus.PUBLISHED:
        return "Published";
      case PublishStatus.DRAFT:
        return "Draft";
      case PublishStatus.ARCHIVED:
        return "Archived";
      default:
        return status;
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto px-2 py-4">
      <Card className="border-0 shadow-lg dark:shadow-xl dark:shadow-gray-900/20 max-w-4xl mx-auto">
        <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-gray-900 rounded-t-lg border-b">
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              {course ? "Edit Course" : "Create New Course"}
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {course ? "Update your course details and inclusions" : "Create a new course with comprehensive details"}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course Details Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Course Details</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
                    <span>Course Title</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="title"
                    name="title" 
                    value={form.title} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter course title"
                    className="focus-visible:ring-primary h-11 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-800/50"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1">
                    <span>Description</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea 
                    id="description"
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    required 
                    placeholder="Describe what students will learn in this course, including key features and benefits..."
                    rows={4}
                    className="focus-visible:ring-primary resize-none border-gray-300 dark:border-gray-600 dark:bg-gray-800/50 min-h-[120px]"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2 dark:bg-gray-700" />

            {/* Pricing Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/40">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Pricing Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1">
                    <span>Regular Price (₹)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      ₹
                    </span>
                    <Input 
                      id="price"
                      type="number" 
                      name="price" 
                      value={form.price} 
                      onChange={handleChange} 
                      required 
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="focus-visible:ring-primary h-11 pl-10 border-gray-300 dark:border-gray-600 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="actualPrice" className="text-sm font-medium flex items-center gap-1">
                    <span>Discounted Price (₹)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      ₹
                    </span>
                    <Input 
                      id="actualPrice"
                      type="number" 
                      name="actualPrice" 
                      value={form.actualPrice} 
                      onChange={handleChange} 
                      required 
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="focus-visible:ring-primary h-11 pl-10 border-gray-300 dark:border-gray-600 dark:bg-gray-800/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-2 dark:bg-gray-700" />

            {/* Duration & Status Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Duration, Order & Status</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="durationMonths" className="text-sm font-medium flex items-center gap-1">
                    <span>Duration (months)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="durationMonths"
                    type="number" 
                    name="durationMonths" 
                    value={form.durationMonths} 
                    onChange={handleChange} 
                    required 
                    min="1"
                    placeholder="3"
                    className="focus-visible:ring-primary h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800/50"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="order" className="text-sm font-medium flex items-center gap-1">
                    <span>Display Order</span>
                  </Label>
                  <Input 
                    id="order"
                    type="number" 
                    name="order" 
                    value={form.order} 
                    onChange={handleChange} 
                    min="1"
                    placeholder="1"
                    className="focus-visible:ring-primary h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first (leave empty for auto-order)
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm font-medium flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>Status</span>
                  </Label>
                  <Select 
                    value={form.status} 
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="focus:ring-primary h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-800/50">
                      <SelectValue>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status as PublishStatus)}`}>
                          {getStatusText(form.status as PublishStatus)}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value={PublishStatus.DRAFT}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>Draft</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PublishStatus.PUBLISHED}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Published</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PublishStatus.ARCHIVED}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span>Archived</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="my-2 dark:bg-gray-700" />

            {/* ✅ Course Inclusions Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/40">
                  <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Course Inclusions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select additional items to include in this course package
                  </p>
                </div>
              </div>

              {loadingInclusions ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-sm text-muted-foreground">Loading available items...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mock Tests */}
                  {inclusionOptions.mockTests.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base flex items-center gap-2">
                          <span>Individual Mock Tests</span>
                          <Badge variant="outline" className="ml-2">
                            {inclusionOptions.mockTests.length} available
                          </Badge>
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30">
                        {inclusionOptions.mockTests.map((mock) => (
                          <label key={mock.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-sm">
                            <Checkbox 
                              checked={selectedInclusions.mockTests.includes(mock.id)}
                              onCheckedChange={() => handleInclusionToggle('mockTests', mock.id)}
                              className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{mock.title}</div>
                              {mock.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mock.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  {mock.difficulty}
                                </Badge>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">₹{mock.price}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mock Bundles */}
                  {inclusionOptions.mockBundles.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base flex items-center gap-2">
                          <span>Mock Bundles</span>
                          <Badge variant="outline" className="ml-2">
                            {inclusionOptions.mockBundles.length} available
                          </Badge>
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30">
                        {inclusionOptions.mockBundles.map((bundle) => (
                          <label key={bundle.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-sm">
                            <Checkbox 
                              checked={selectedInclusions.mockBundles.includes(bundle.id)}
                              onCheckedChange={() => handleInclusionToggle('mockBundles', bundle.id)}
                              className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{bundle.title}</div>
                              {bundle.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bundle.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                  {bundle.mockCount} mocks
                                </Badge>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">₹{bundle.price}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sessions */}
                  {inclusionOptions.sessions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base flex items-center gap-2">
                          <span>Guidance Sessions</span>
                          <Badge variant="outline" className="ml-2">
                            {inclusionOptions.sessions.length} available
                          </Badge>
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/30">
                        {inclusionOptions.sessions.map((session) => (
                          <label key={session.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-sm">
                            <Checkbox 
                              checked={selectedInclusions.sessions.includes(session.id)}
                              onCheckedChange={() => handleInclusionToggle('sessions', session.id)}
                              className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{session.title}</div>
                              {session.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{session.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  {session.sessionType}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{session.duration}min</Badge>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">₹{session.price}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Inclusions Summary */}
                  {(selectedInclusions.mockTests.length > 0 || selectedInclusions.mockBundles.length > 0 || selectedInclusions.sessions.length > 0) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h5 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Selected Inclusions Summary
                      </h5>
                      <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                        {selectedInclusions.mockTests.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>{selectedInclusions.mockTests.length} Mock Test(s)</span>
                          </div>
                        )}
                        {selectedInclusions.mockBundles.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span>{selectedInclusions.mockBundles.length} Mock Bundle(s)</span>
                          </div>
                        )}
                        {selectedInclusions.sessions.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span>{selectedInclusions.sessions.length} Guidance Session(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {inclusionOptions.mockTests.length === 0 && inclusionOptions.mockBundles.length === 0 && inclusionOptions.sessions.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-muted-foreground">No inclusion options available</p>
                      <p className="text-xs text-muted-foreground mt-1">Create mock tests, bundles, or sessions first to include them here</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[160px] h-12 bg-primary hover:bg-primary/90 flex items-center gap-2 text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{course ? "Update Course" : "Create Course"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}