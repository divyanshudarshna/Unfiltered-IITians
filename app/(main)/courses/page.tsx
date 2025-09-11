import CourseList from "@/components/CourseList";

export default function CoursesPage() {
  return (
    <CourseList 
      title="Master Your Skills with Our Courses"
      description="Discover comprehensive courses designed by industry experts to boost your career"
      showSearch={true}
      fetchCourses={true}
      showViewAllButton={false}
    />
  );
}