import CourseList from "@/components/CourseList";
export const revalidate = 60; 
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