"use client"

import { User } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Props = { users: User[] }

export function CourseProgress({ users }: Props) {
  // Build average progress per course
  const courseProgress: Record<string, number[]> = {}
  users.forEach((u) => {
    u.courseProgress?.forEach((p) => {
      if (!courseProgress[p.courseId]) courseProgress[p.courseId] = []
      courseProgress[p.courseId].push(p.progress)
    })
  })

  const data = Object.keys(courseProgress).map((courseId) => ({
    course: courseId,
    avgProgress:
      courseProgress[courseId].reduce((a, b) => a + b, 0) /
      courseProgress[courseId].length,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-amber-600">
          Course Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="course" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="avgProgress"
                stroke="#f59e0b"
                strokeWidth={3}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
