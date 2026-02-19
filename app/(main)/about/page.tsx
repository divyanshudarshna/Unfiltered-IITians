"use client";

import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Microscope,
  Youtube,
  Dna,
  Handshake,
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
    icon: <GraduationCap className="w-12 h-12 text-cyan-400" />, // bigger
    title: "Academic Journey",
    content:
      "Bachelor's in Biotechnology from Central University of Rajasthan (2017–2020), Master's from IIT Bombay (2020–2022), currently pursuing PhD in Neuroscience at IIT Roorkee, specializing in Alzheimer's disease research and therapeutic development.",
  },
  {
    icon: <GraduationCap className="w-12 h-12 text-purple-400" />,
    title: "Teaching Philosophy",
    content:
      "I specialize in demystifying complex topics through structured analogies and real-world applications. My approach combines conceptual clarity with exam-focused strategies to maximize student success.",
  },
  {
    icon: <Microscope className="w-12 h-12 text-green-400" />,
    title: "Scientific Research",
    content:
      "My work focuses on neurodegenerative diseases, particularly Alzheimer's. I've contributed to cutting-edge research with publications in reputed journals and presentations at international conferences.",
  },
  {
    icon: <Youtube className="w-12 h-12 text-red-400" />,
    title: "Educational Content",
    content:
      "Through our YouTube channel, we share exam strategies, research insights, and career guidance to help thousands of students navigate their academic journeys successfully.",
    link: "https://www.youtube.com/@unfilterediitroorkee",
  },
  {
    icon: <Dna className="w-12 h-12 text-green-400" />,
    title: "Biotech Expertise",
    content:
      "Comprehensive knowledge across biochemistry, microbiology, immunology, and bioprocess engineering — the core disciplines we help students master for competitive exams.",
  },
  {
    icon: <Handshake className="w-12 h-12 text-amber-400" />,
    title: "Career Guidance",
    content:
      "Personalized mentorship for students navigating Master's or PhD admissions, research careers, or industry transitions — drawing from our own experiences at premier institutions.",
  },
  {
    icon: <span className="text-5xl">🥋</span>,
    title: "Martial Arts",
    content:
      "As a Taekwondo black belt and MMA practitioner, I've learned discipline and resilience that inform both research and teaching methodologies.",
  },
  {
    icon: <span className="text-5xl">💪</span>,
    title: "Fitness Philosophy",
    content:
      "Our commitment to physical health mirrors our academic approach — consistent, disciplined training yields transformative results in both body and mind.",
  },
  {
    icon: <Video className="w-12 h-12 text-pink-400" />,
    title: "Video Editing",
    content:
      "We create engaging educational videos with professional editing techniques to enhance learning experiences and make complex topics visually appealing.",
  },
  {
    icon: <PenSquare className="w-12 h-12 text-teal-400" />,
    title: "Copywriting",
    content:
      "Skilled in crafting compelling scientific, visually aesthetic, educational, and engaging content that communicates complex ideas with clarity and impact.",
  },
  {
    icon: <Gamepad2 className="w-12 h-12 text-violet-400" />,
    title: "Gaming & Strategy",
    content:
      "An avid gamer who enjoys strategic, action, and mind-bending games that sharpen problem-solving skills, reflexes, and creative thinking.",
  },
  {
    icon: <Bot className="w-12 h-12 text-cyan-400" />,
    title: "AI & Technology",
    content:
      "Leveraging AI tools for data analysis, scientific communication, and applications in neuroscience, biotech, and automation.",
  },
];

export const dynamic = "force-static";
export default function About() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
          Bridging Science & Education Through Passionate Mentorship
        </h1>
        <p className="text-lg text-slate-800 dark:text-slate-300 max-w-3xl mx-auto mb-12">
          As an IIT researcher and educator, I'm dedicated to transforming
          complex scientific concepts into accessible knowledge. My journey from
          student to mentor has equipped me with unique insights into what it
          takes to excel in competitive exams and research careers. Below you'll
          discover my academic background, professional expertise, and personal
          passions that shape my teaching philosophy.
        </p>

        <div className="flex justify-center mb-12">
          <Tilt
            className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 border-4  rounded-full overflow-hidden shadow-sm transition-all duration-500 hover:shadow-[0_0_50px_8px_rgba(168,85,247,0.55)] hover:border-primary/70"
            tiltMaxAngleX={20}
            tiltMaxAngleY={20}
            perspective={1000}
            scale={1.05}
            transitionSpeed={1000}
            gyroscope={true}
          >
            <Image
              src="https://res.cloudinary.com/dqe1wy2nc/image/upload/v1758919081/admin-uploads/about-277c5b7e.webp"
              alt="Profile Picture"
              width={450}
              height={450}
              className="object-cover w-full h-full"
              priority
            />
          </Tilt>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 dark:text-white text-black ">Academic Milestones</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {academicMilestones.map((milestone, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm font-medium hover:scale-105 transition-all"
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
        className={`relative h-full transition-all duration-500
          hover:scale-[1.02] hover:shadow-xl bg-gray-100
          dark:bg-slate-900/30 border hover:bg-violet-900/20 border-slate-700
          before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-transparent
          hover:before:border-violet-500 hover:before:shadow-[0_0_25px_5px_rgba(139,92,246,0.5)] flex flex-col items-center text-center p-6`}
      >
        <div className="mb-4 flex justify-center ">{skill.icon}</div>
        <CardHeader className="p-0 mb-3 flex flex-col items-center">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {skill.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-base text-slate-700 dark:text-slate-300">{skill.content}</p>
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
