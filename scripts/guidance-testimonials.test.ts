import assert from "node:assert/strict";
import {
  clampGuidanceTestimonialRating,
  getYoutubeEmbedUrl,
  getYoutubeVideoId,
  normalizeGuidanceTestimonialStatus,
  normalizeGuidanceTestimonialType,
} from "../lib/guidance-testimonials";

assert.equal(getYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(getYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=12"), "dQw4w9WgXcQ");
assert.equal(getYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(getYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(getYoutubeVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
assert.equal(getYoutubeVideoId("not a youtube url"), null);
assert.equal(getYoutubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube.com/embed/dQw4w9WgXcQ");

assert.equal(normalizeGuidanceTestimonialType(undefined), "YOUTUBE");
assert.equal(normalizeGuidanceTestimonialType("testimonial"), "TESTIMONIAL");

assert.equal(normalizeGuidanceTestimonialStatus(undefined), "ACTIVE");
assert.equal(normalizeGuidanceTestimonialStatus("draft"), "DRAFT");
assert.equal(normalizeGuidanceTestimonialStatus("archive"), "ARCHIVED");
assert.equal(normalizeGuidanceTestimonialStatus("archived"), "ARCHIVED");

assert.equal(clampGuidanceTestimonialRating(undefined), 5);
assert.equal(clampGuidanceTestimonialRating(6), 5);
assert.equal(clampGuidanceTestimonialRating(-1), 0);
assert.equal(clampGuidanceTestimonialRating(4.5), 4.5);

console.log("guidance-testimonials tests passed");
