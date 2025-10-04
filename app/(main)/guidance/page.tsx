import GuidanceSessionsList from "@/components/GuidanceSessionsList";

export default function GuidancePage() {
  return (
    <GuidanceSessionsList
      showTestimonials={true}
      testimonialsTitle="Student Reviews"
      testimonialsDescription="Hear from students who have transformed their academic journey with personalized guidance"
    />
  );
}
