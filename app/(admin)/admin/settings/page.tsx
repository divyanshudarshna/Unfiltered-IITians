"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Mail, 
  DollarSign,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";

export default function AdminSettingsPage() {
  const settingsOptions = [
    {
      title: "File Management",
      description: "Upload and manage static files, images, videos, and documents",
      icon: FileText,
      href: "/admin/settings/file-management",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Email Logs",
      description: "View and manage all emails sent from the platform",
      icon: Mail,
      href: "/admin/settings/email-logs",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Revenue & Disbursement",
      description: "Manage revenue tracking, disbursements, and automatic resets",
      icon: DollarSign,
      href: "/admin/settings/revenue",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your application settings and configurations</p>
          </div>
        </div>
      </div>

      {/* Settings Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {settingsOptions.map((option) => (
          <Link key={option.href} href={option.href}>
            <Card className="h-full hover:shadow-lg dark:hover:shadow-purple-500/10 transition-shadow duration-200 cursor-pointer group border-gray-200 dark:border-gray-800">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${option.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <option.icon className={`w-6 h-6 ${option.color}`} />
                </div>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
                  {option.title}
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform duration-200" />
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-600 dark:bg-purple-700 rounded-lg">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Admin Settings</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                These settings control critical aspects of your application. Make changes carefully and ensure you have proper authorization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
