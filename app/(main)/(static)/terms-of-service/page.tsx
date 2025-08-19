// app/(main)/(static)/terms-of-service/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Layers,
  UserCheck,
  CreditCard,
  BookOpen,
  AlertTriangle,
  Wrench,
  Scale,
  RefreshCcw,
  Mail,
} from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Card className="shadow-lg rounded-xl border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="bg-indigo-50 dark:bg-gray-800 border-b border-indigo-100 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center gap-4 mt-4">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Terms of Service
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* Introduction */}
          <div className="bg-indigo-50/50 dark:bg-gray-800/50 p-4 rounded-lg flex items-start gap-3 border border-indigo-100 dark:border-gray-700">
            <FileText className="w-5 h-5 mt-0.5 text-indigo-600 dark:text-indigo-300 flex-shrink-0" />
            <p className="text-gray-700 dark:text-gray-300">
              Welcome to Divyanshu Darshna's website. By accessing or using our
              website and services, you agree to comply with and be bound by
              the following terms and conditions. Please read these Terms of
              Service carefully before using our services.
            </p>
          </div>

          <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

          {/* 1. Acceptance of Terms */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                1. Acceptance of Terms
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              By accessing or using any part of the website, you agree to be bound
              by these Terms of Service. If you do not agree, you may not access
              the website or use any services.
            </p>
          </section>

          {/* 2. Services Offered */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                2. Services Offered
              </h2>
            </div>
            <ul className="pl-12 list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Personalized academic guidance sessions</li>
              <li>Online courses and study materials</li>
              <li>YouTube educational content</li>
              <li>Other educational resources and tools</li>
            </ul>
          </section>

          {/* 3. User Responsibilities */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                3. User Responsibilities
              </h2>
            </div>
            <ul className="pl-12 list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Provide accurate and complete information when registering.</li>
              <li>Maintain confidentiality of account credentials.</li>
              <li>Use services only for lawful purposes.</li>
              <li>
                Do not reproduce, duplicate, copy, sell, or exploit services
                without express written permission.
              </li>
            </ul>
          </section>

          {/* 4. Payment and Refunds */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                4. Payment and Refunds
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              All fees are non-refundable except as required by law or as stated
              in our Refund Policy. Pricing may change periodically. You are
              responsible for accurate billing information. Refer to our Refund
              Policy for details.
            </p>
          </section>

          {/* 5. Intellectual Property */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                5. Intellectual Property
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              All content including text, graphics, logos, images, videos, and
              course materials are owned by Divyanshu Darshna or its suppliers,
              protected by intellectual property laws. You may not modify,
              reproduce, or distribute without written consent.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                6. Limitation of Liability
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              We are not liable for indirect, incidental, special, or punitive
              damages resulting from use or inability to use services, third-party
              conduct, unauthorized access, or content obtained from the services.
            </p>
          </section>

          {/* 7. Modifications to Services */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <Wrench className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                7. Modifications to Services
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              We may modify or discontinue services temporarily or permanently,
              with or without notice, and are not liable for any resulting
              impact.
            </p>
          </section>

          {/* 8. Governing Law */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                8. Governing Law
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              These Terms are governed by the laws of India. Disputes shall be
              resolved in the courts of Roorkee, Uttarakhand.
            </p>
          </section>

          {/* 9. Changes to Terms */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                9. Changes to Terms
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              We may update these Terms at any time by posting changes on this
              page. Continued use of services constitutes acceptance.
            </p>
          </section>

          {/* 10. Contact Information */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                10. Contact Information
              </h2>
            </div>
            <p className="pl-12 text-gray-700 dark:text-gray-300">
              Questions about the Terms of Service should be sent via our contact
              page or email support at {" "}
              <a
                href="mailto:support@divyanshudarshna.com"
                className="text-indigo-600 dark:text-indigo-300 hover:underline"
              >
                support@divyanshudarshna.com
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
