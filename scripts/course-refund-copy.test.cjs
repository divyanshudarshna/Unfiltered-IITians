const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
require('tsx/cjs');
const React = require('react');
const originalReact = global.React;
global.React = React;
const { renderToStaticMarkup } = require('react-dom/server');

const faqs = [
  { id: 'course-policy', category: 'Getting Started', question: 'What is the refund policy for the courses?', answer: 'Refunds are available within 7 days of purchase.' },
  { id: 'course-guarantee', category: 'Courses', question: 'What if I am not satisfied?', answer: 'We offer a money-back guarantee.' },
  { id: 'course-content', category: 'Courses', question: 'How do I access the course?', answer: 'Sign in to view your materials.' },
  { id: 'mock-policy', category: 'Mocks', question: 'Are mock tests refundable?', answer: 'Contact support about mock payments.' },
  { id: 'guidance-policy', category: 'Sessions', question: 'Can I refund a guidance session?', answer: 'See the session cancellation policy.' },
];
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@/lib/prisma') return { prisma: { fAQ: { findMany: async () => faqs } } };
  if (['@/components/CourseList', '@/components/faq', '@/components/MockBundlesSection'].includes(request)) {
    return { __esModule: true, default: () => React.createElement('div', null, request) };
  }
  return originalLoad.call(this, request, parent, isMain);
};

(async () => {
  const CoursesPage = require('../app/(main)/courses/page.tsx').default;
  const html = renderToStaticMarkup(React.createElement(CoursesPage));
  assert.doesNotMatch(html, /money[\s-]*back|full refund|no questions asked/i, 'The public courses page must not advertise the refund guarantee');
  assert.match(html, /CourseList/);
  assert.match(html, /MockBundlesSection/);
  assert.match(html, /Book a Guidance Session/);

  const { GET } = require('../app/api/faq/route.ts');
  const response = await GET(new Request('https://example.com/api/faq'));
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.deepEqual(json.data.map(faq => faq.id), ['course-content', 'mock-policy', 'guidance-policy'], 'Public course refund FAQs must be hidden without hiding unrelated products');
  assert.equal(json.count, 3);

  function checkCourseFiles(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) checkCourseFiles(file);
      else if (entry.name.endsWith('.tsx')) {
        assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /money[\s-]*back|full refund|no questions asked/i, `Course frontend copy still advertises a refund guarantee in ${file}`);
      }
    }
  }
  checkCourseFiles(path.join(__dirname, '../app/(main)/courses'));
  console.log('Course guarantee removal, retained page content and public FAQ scope checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  Module._load = originalLoad;
  global.React = originalReact;
});
