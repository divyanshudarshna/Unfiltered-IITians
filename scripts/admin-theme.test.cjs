const assert = require('node:assert/strict');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
require('tsx/cjs');
let pathname = '/admin';
const originalLoad = Module._load;
Module._load = function (request) {
  if (request === 'next/navigation') return { usePathname: () => pathname };
  if (request.includes('useIsHydrated')) return { useIsHydrated: () => true };
  if (request === 'next-themes') return {
    ThemeProvider: ({ forcedTheme, children }) => React.createElement('div', { 'data-forced-theme': forcedTheme }, children),
  };
  return originalLoad.apply(this, arguments);
};
const { ThemeProvider } = require('../components/ThemeProvider.tsx');
Module._load = originalLoad;
function forcedThemeAt(path, props = {}) {
  pathname = path;
  return renderToStaticMarkup(React.createElement(ThemeProvider, { ...props }, 'page'));
}
for (const route of ['/admin', '/admin/', '/admin/course-enrollments', '/admin/mocks/123', '/admin/users/123']) {
  assert.match(forcedThemeAt(route, { defaultTheme: 'light', forcedTheme: 'light' }), /data-forced-theme="dark"/);
}
assert.match(forcedThemeAt('/mocks/mock-1/attempt/attempt-1'), /data-forced-theme="light"/);
assert.match(forcedThemeAt('/admin/course-enrollments'), /data-forced-theme="dark"/, 'Returning from a mock must force dark again');
for (const route of ['/', '/courses/123', '/administrator', '/mocks/123']) {
  assert.doesNotMatch(forcedThemeAt(route), /data-forced-theme=/, 'Other routes retain the saved theme');
}
assert.match(forcedThemeAt('/courses/123', { forcedTheme: 'light' }), /data-forced-theme="light"/);
console.log('admin-only dark theme and temporary mock light theme tests passed');
