// app/(main)/(static)/refund-policy/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Clock,
  Zap,
  Mail,
  Calendar,
  FileText,
  Percent,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  BarChart2,
  Users,
  AlertTriangle,
  ChevronsRight,
} from "lucide-react";
export const dynamic = "force-static";
export default function RefundPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Card className="shadow-lg rounded-xl border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="bg-indigo-50 dark:bg-gray-800 border-b border-indigo-100 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center gap-4 mt-4">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Refund Policy
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* Introduction */}
          <div className="bg-indigo-50/50 dark:bg-gray-800/50 p-4 rounded-lg flex items-start gap-3 border border-indigo-100 dark:border-gray-700">
            <AlertCircle className="w-5 h-5 mt-0.5 text-indigo-600 dark:text-indigo-300 flex-shrink-0" />
            <p className="text-gray-700 dark:text-gray-300">
              Thank you for choosing our services. We are committed to your
              satisfaction while maintaining fair business practices. This
              comprehensive refund policy covers all aspects of our service
              offerings, including digital products, coaching services,
              subscription plans, and mock tests.
            </p>
          </div>

          <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

          {/* 1. General Refund Principles */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                1. General Refund Principles
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We design our refund policy to balance customer satisfaction
                with sustainable business operations. Refund requests for
                digital products must be submitted within 7 days of purchase,
                while coaching service refunds must be requested before the
                second session begins. All approved refunds are processed within
                7-14 business days to the original payment method, though your
                financial institution may require additional processing time.
              </p>
              <p>
                We maintain the right to refuse refunds in cases of policy
                abuse, including but not limited to: downloading substantial
                course materials before requesting refunds, sharing account
                access with non-paying individuals, or providing misleading
                information in refund requests. When granting refunds after
                partial service use, we deduct a prorated amount for services
                already delivered plus a 10% administrative fee for processing.
              </p>
            </div>
          </section>

          {/* 2. Subscription Service Terms */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                2. Subscription Service Terms
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                For our recurring subscription services, cancellation can be
                initiated anytime through your account dashboard. Your
                subscription remains active until the current billing cycle
                concludes, with no additional charges after cancellation.
                Refunds for subscription payments are exclusively available when
                requested within 3 days of payment and before substantial
                service utilization.
              </p>
              <p>
                We do not offer partial refunds for unused subscription periods.
                Annual subscriptions canceled within 30 days may qualify for a
                prorated refund minus the 10% administrative fee. All
                promotional or discounted subscriptions marked as "final sale"
                at purchase are strictly non-refundable under any circumstances.
              </p>
            </div>
          </section>

          {/* 3. Promotional Offers and Discounted Purchases */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Percent className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                3. Promotional Offers and Discounted Purchases
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Services acquired during special promotions, flash sales, or
                using discount codes carry distinct refund conditions. Unless
                explicitly stated in the promotion terms, all reduced-price
                purchases are final and non-refundable. This policy encompasses
                bundle deals, limited-time offers, early-bird pricing, and
                referral discounts without exception.
              </p>
              <p>
                Promotional packages including bonus materials require
                forfeiture of all bonus content with any refund request. For
                promotions containing physical goods, customers must return
                these items unused at their own expense before we process any
                digital component refunds. We reserve the unilateral right to
                convert cash refunds to account credit for promotional
                purchases.
              </p>
            </div>
          </section>

          {/* 4. Digital Products Refund Guidelines */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                4. Digital Products Refund Guidelines
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Our digital courses and materials qualify for refunds under
                specific parameters. Full refunds are available when less than
                15% of course content is accessed within the initial 3-day
                period. Partial refunds (50% of purchase price) apply when
                20-50% of content is accessed within the first week. No refunds
                are possible after accessing over 50% of course materials or
                attempting any certification examination.
              </p>
              <p>
                Digital content becomes non-refundable once downloaded or
                streamed beyond the established thresholds. Our learning
                management system meticulously tracks content access, and refund
                determinations rely on these precise metrics. For technical
                barriers preventing access, we prioritize problem resolution
                before entertaining refund requests, typically within a 48-hour
                response window.
              </p>
            </div>
          </section>

          {/* 5. Mock Test Refund Policy */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                5. Mock Test Refund Policy
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Our mock test services have specific refund conditions due to
                their nature:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                    ✖
                  </span>
                  <p>
                    No refunds will be given if more than two mock tests have
                    been accessed or attempted.
                  </p>
                </li>

                <li className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                    ✓
                  </span>
                  <p>
                    70% partial refund available for cancellations requested
                    within 3 days of purchase, provided less than 20% of test
                    content has been accessed.
                  </p>
                </li>

                <li className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                    ✓
                  </span>
                  <p>
                    50% partial refund available for cancellations requested
                    between 3–7 days of purchase, provided less than 20% of test
                    content has been accessed.
                  </p>
                </li>

                <li className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                    ✖
                  </span>
                  <p>
                    No refunds if any mock test has been fully attempted or
                    completed, regardless of the score or results.
                  </p>
                </li>

                <li className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                    !
                  </span>
                  <p>
                    Once test results are generated or shared, the purchase
                    becomes non-refundable.
                  </p>
                </li>

                <li className="flex items-start gap-3">
                  <span className="mt-1 h-5 w-5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                    !
                  </span>
                  <p>
                    Bundle packages containing mock tests follow the most
                    restrictive refund policy among included items.
                  </p>
                </li>
              </ul>

              <p>
                Mock test access is defined as viewing test questions, starting
                the timer, or submitting any answers. Our system tracks all
                interactions with mock tests to enforce these policies fairly.
              </p>
            </div>
          </section>

          {/* 6. Coaching Services Refund Structure */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                6. Coaching Services Refund Structure
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Personalized coaching services adhere to a stringent refund
                schedule. Full refunds are granted for cancellations made at
                least 48 hours before the first scheduled session for both
                individual and combo sessions. A 50% refund applies to
                cancellations occurring after the first session but before the
                second session commencement. No refunds are available after
                completing the second session or for no-shows without 24-hour
                advance notice for individual or combo packages.
              </p>
              <p>
                For coaching packages comprising five or more sessions, unused
                sessions may convert to account credit valid for six months from
                cancellation date. This credit applies toward other services but
                carries no cash value. Session rescheduling doesn't affect
                refund eligibility provided it occurs before the established
                cancellation deadlines.
              </p>
            </div>
          </section>

          {/* 7. Refund Request Procedure */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <ChevronsRight className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                7. Refund Request Procedure
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Submit refund requests in writing to{" "}
                <a
                  href="mailto:support@divyanshudarshna.com"
                  className="text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  support@divyanshudarshna.com
                </a>{" "}
                with "Refund Request" in the subject line. Include your full
                name, order number, purchase date, and detailed justification.
                We may require supplemental information like technical issue
                documentation before processing.
              </p>
              <p>
                Refund processing commences only after receiving complete
                information. Approved refunds issue within 7-14 business days
                with email confirmation upon completion. For third-party
                platform purchases (e.g., app stores), follow their respective
                refund procedures as we cannot process these directly.
              </p>
            </div>
          </section>

          {/* 8. Exceptional Circumstances */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                8. Exceptional Circumstances
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We recognize that extraordinary situations sometimes warrant
                special consideration. Documented medical emergencies, military
                deployments, or natural disasters may qualify for extended
                refund periods or account credits. These requests require
                official documentation and receive individual evaluation.
              </p>
              <p>
                Technical impediments preventing service access receive prompt
                attention. Unresolved access issues persisting beyond 48 hours
                from reported may qualify for service extensions or refunds at
                our discretion. Immediate issue reporting is essential for these
                considerations.
              </p>
            </div>
          </section>

          {/* 9. Policy Modifications and Dispute Resolution */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                9. Policy Modifications and Dispute Resolution
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We reserve the right to modify this refund policy at any time,
                with changes effective immediately upon website posting.
                Customers bear responsibility for periodically reviewing the
                policy, with continued service use constituting acceptance of
                the current version.
              </p>
              <p>
                For unresolved refund disputes, request mediation by contacting{" "}
                <a
                  href="mailto:support@divyanshudarshna.com"
                  className="text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  support@divyanshudarshna.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* 10. Contact Information */}
          <section className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                10. Contact Information
              </h2>
            </div>
            <div className="pl-12 space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                For policy questions or refund requests, contact our support
                team at{" "}
                <a
                  href="mailto:support@divyanshudarshna.com"
                  className="text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  support@divyanshudarshna.com
                </a>
                . Urgent matters may use our website contact form during
                business hours (Monday-Friday, 9AM-5PM IST).
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
