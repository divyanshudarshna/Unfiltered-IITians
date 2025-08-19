// app/(main)/(static)/privacy-policy/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  User,
  Database,
  Lock,
  KeyRound,
  Cookie,
  UserX,
  RefreshCcw,
  Mail,
  AlertCircle,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Card className="shadow-lg rounded-xl border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="bg-indigo-50 dark:bg-gray-800 border-b border-indigo-100 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center gap-4 mt-4">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Privacy Policy
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* Introduction */}
          <div className="bg-indigo-50/50 dark:bg-gray-800/50 p-4 rounded-lg flex items-start gap-3 border border-indigo-100 dark:border-gray-700">
            <AlertCircle className="w-5 h-5 mt-0.5 text-indigo-600 dark:text-indigo-300 flex-shrink-0" />
            <p className="text-gray-700 dark:text-gray-300">
              Welcome to our Website. We are committed to protecting your
              privacy and ensuring the security of your personal information.
              This Privacy Policy explains how we collect, use, and safeguard
              your information when you visit our website.
            </p>
          </div>

          <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

          {/* 1. Information We Collect */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                1. Information We Collect
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We may collect the following types of information when you visit our website:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Personal Information:</strong> Includes name, email,
                  phone number, or details you submit through forms or
                  communications.
                </li>
                <li>
                  <strong>Non-Personal Information:</strong> Technical data such
                  as IP address, browser type, operating system, and browsing
                  behavior collected through cookies.
                </li>
              </ul>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                2. How We Use Your Information
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>We use collected personal information for:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Internal R&D:</strong> Improve website, services, and user experience.</li>
                <li><strong>Communication:</strong> Respond to inquiries and provide updates (if opted in).</li>
                <li><strong>Legal Compliance:</strong> To meet regulatory obligations.</li>
              </ul>
            </div>
          </section>

          {/* 3. Information Sharing */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                3. Information Sharing
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              We do not share, sell, rent, or trade your personal information with any third parties. Data is strictly for internal use.
            </p>
          </section>

          {/* 4. Data Security */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                4. Data Security
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              We implement reasonable measures to protect your personal
              information, but no method of internet transmission or storage is
              100% secure.
            </p>
          </section>

          {/* 5. Your Rights */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <UserX className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                5. Your Rights
              </h2>
            </div>
            <ul className="pl-12 list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Correction:</strong> Request updates or corrections.</li>
              <li><strong>Deletion:</strong> Request deletion, subject to legal obligations.</li>
              <li><strong>Opt-Out:</strong> Stop receiving communications anytime.</li>
            </ul>
          </section>

          {/* 6. Cookies and Tracking */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Cookie className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                6. Cookies and Tracking Technologies
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              We may use cookies to enhance browsing experience. You can manage
              or disable cookies via browser settings, but it may impact site
              functionality.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                7. Children's Privacy
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              Our website is not intended for individuals under 13. We do not knowingly collect such data. If discovered, it will be deleted.
            </p>
          </section>

          {/* 8. Changes to Policy */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                8. Changes to This Privacy Policy
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              Updates may occur, with changes posted here. We encourage periodic review.
            </p>
          </section>

          {/* 9. Contact Us */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                9. Contact Us
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              If you have questions about this Privacy Policy, please contact us
              at <a href="mailto:support@divyanshudarshna.com" className="text-indigo-600 dark:text-indigo-300 hover:underline">support@divyanshudarshna.com</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
