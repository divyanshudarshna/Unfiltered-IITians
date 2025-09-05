"use client";

import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Microscope,
  Youtube,
  Dna,
  Handshake,
  Activity,
  Video,
  PenSquare,
  Gamepad2,
  Bot,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Tilt from "react-parallax-tilt";
const academicMilestones = [
  "NPTEL Star Performer",
  "IIT JAM Qualified",
  "GATE-BT Qualified",
  "GATE-XL Qualified",
  "CUCET-UG (now CUET) Qualified",
];

const skills = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Academic Journey",
    content:
      "Bachelor's in Biotechnology from Central University of Rajasthan (2017–2020), Master's from IIT Bombay (2020–2022), currently pursuing PhD in Neuroscience at IIT Roorkee, specializing in Alzheimer's disease research and therapeutic development.",
    bg: "bg-blue-100 dark:bg-blue-900/20",
    border: "border-blue-500",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Teaching Philosophy",
    content:
      "I specialize in demystifying complex topics through structured analogies and real-world applications. My approach combines conceptual clarity with exam-focused strategies to maximize student success.",
    bg: "bg-purple-100 dark:bg-purple-900/20",
    border: "border-purple-500",
  },
  {
    icon: <Microscope className="w-6 h-6" />,
    title: "Scientific Research",
    content:
      "My work focuses on neurodegenerative diseases, particularly Alzheimer's. I've contributed to cutting-edge research with publications in reputed journals and presentations at international conferences.",
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    border: "border-emerald-500",
  },
  {
    icon: <Youtube className="w-6 h-6" />,
    title: "Educational Content",
    content:
      "Through our YouTube channel, we share exam strategies, research insights, and career guidance to help thousands of students navigate their academic journeys successfully.",
    bg: "bg-red-100 dark:bg-red-900/20",
    border: "border-red-500",
    link: "https://www.youtube.com/@unfilterediitroorkee",
  },
  {
    icon: <Dna className="w-6 h-6" />,
    title: "Biotech Expertise",
    content:
      "Comprehensive knowledge across biochemistry, microbiology, immunology, and bioprocess engineering — the core disciplines we help students master for competitive exams.",
    bg: "bg-green-100 dark:bg-green-900/20",
    border: "border-green-500",
  },
  {
    icon: <Handshake className="w-6 h-6" />,
    title: "Career Guidance",
    content:
      "Personalized mentorship for students navigating Master's or PhD admissions, research careers, or industry transitions — drawing from our own experiences at premier institutions.",
    bg: "bg-amber-100 dark:bg-amber-900/20",
    border: "border-amber-500",
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: "Martial Arts",
    content:
      "As a Taekwondo black belt and MMA practitioner, I've learned discipline and resilience that inform both research and teaching methodologies.",
    bg: "bg-rose-100 dark:bg-rose-900/20",
    border: "border-rose-500",
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: "Fitness Philosophy",
    content:
      "Our commitment to physical health mirrors our academic approach — consistent, disciplined training yields transformative results in both body and mind.",
    bg: "bg-indigo-100 dark:bg-indigo-900/20",
    border: "border-indigo-500",
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: "Video Editing",
    content:
      "We create engaging educational videos with professional editing techniques to enhance learning experiences and make complex topics visually appealing.",
    bg: "bg-pink-100 dark:bg-pink-900/20",
    border: "border-pink-500",
  },
  {
    icon: <PenSquare className="w-6 h-6" />,
    title: "Copywriting",
    content:
      "Skilled in crafting compelling scientific, visually aesthetic, educational, and engaging content that communicates complex ideas with clarity and impact.",
    bg: "bg-teal-100 dark:bg-teal-900/20",
    border: "border-teal-500",
  },
  {
    icon: <Gamepad2 className="w-6 h-6" />,
    title: "Gaming & Strategy",
    content:
      "An avid gamer who enjoys strategic, action, and mind-bending games that sharpen problem-solving skills, reflexes, and creative thinking.",
    bg: "bg-violet-100 dark:bg-violet-900/20",
    border: "border-violet-500",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI & Technology",
    content:
      "Leveraging AI tools for data analysis, scientific communication, and applications in neuroscience, biotech, and automation.",
    bg: "bg-cyan-100 dark:bg-cyan-900/20",
    border: "border-cyan-500",
  },
];

export default function About() {
  return (
    <div className=" py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
          Bridging Science & Education Through Passionate Mentorship
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
          As an IIT researcher and educator, I'm dedicated to transforming
          complex scientific concepts into accessible knowledge. My journey from
          student to mentor has equipped me with unique insights into what it
          takes to excel in competitive exams and research careers. Below you'll
          discover my academic background, professional expertise, and personal
          passions that shape my teaching philosophy.
        </p>

        <div className="flex justify-center mb-12">
          <Tilt
            className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 border-4 border-cyan-400 rounded-full overflow-hidden shadow-xl"
            tiltMaxAngleX={20}
            tiltMaxAngleY={20}
            perspective={1000}
            scale={1.05}
            transitionSpeed={1000}
            gyroscope={true}
          >
            <Image
              src="/about.jpg"
              alt="Profile Picture"
              width={300}
              height={300}
              className="object-cover w-full h-full"
              priority
            />
          </Tilt>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Academic Milestones</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {academicMilestones.map((milestone, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-muted border border-border rounded-full text-sm font-medium hover:scale-105 transition-all"
              >
                {milestone}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill, index) => {
          const CardInner = (
            <Card
              className={`h-full transition-all hover:scale-[1.015] hover:shadow-xl ${skill.bg} ${skill.border} border`}
            >
              <CardHeader className="flex flex-row items-center space-x-4 space-y-0">
                <div className={`p-3 rounded-lg ${skill.bg}`}>{skill.icon}</div>
                <CardTitle>{skill.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{skill.content}</p>
                {skill.title === "AI & Technology" && (
                  <p className="mt-2 text-sm font-semibold text-primary">
                    Fun Fact: This website is created using AI + our skill set.
                  </p>
                )}
              </CardContent>
            </Card>
          );

          return skill.link ? (
            <Link
              href={skill.link}
              key={index}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CardInner}
            </Link>
          ) : (
            <div key={index}>{CardInner}</div>
          );
        })}
      </div>
    </div>
  );
}
