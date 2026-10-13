// Isolated real-component browser checks: Clerk and every HTTP API are mocked.
// Run after npm run build, to reuse the project's generated CSS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const esbuild = require('esbuild');
const puppeteer = require('puppeteer');
async function main() {
  const bundle = await esbuild.build({
    stdin: { sourcefile: 'admin-browser-fixture.tsx', resolveDir: process.cwd(), loader: 'tsx', contents: `
      import React, {useState} from 'react'; import {createRoot} from 'react-dom/client';
      import {ThemeProvider} from './components/ThemeProvider';
      import {CourseBillingDialog} from './components/admin/CourseBillingActions';
      window.testPath='/admin/course-enrollments'; window.calls=[];
      window.fetch=async (url,options={})=> {
        if(options.method==='POST') { window.calls.push(JSON.parse(options.body)); return new Response(JSON.stringify({pending:window.calls.length===1,accessTerminated:true,refundStatus:window.calls.length===1?null:'PROCESSED',refundId:'rfnd_mock',message:window.calls.length===1?'Access ended. Retry this same action.':'Access ended and refund processed.'}),{status:window.calls.length===1?202:200}); }
        return new Response(JSON.stringify({user:{name:'Test student',email:'student@example.com'},course:{title:'Combo course'},payments:[{paymentId:'pay_mock',amountPaise:59900,currency:'INR',status:'CAPTURED',capturedAt:'2026-10-12T14:09:56Z',refundDeadline:'2026-10-19T14:09:56Z',refundEligible:true,refunds:[]}]}));
      };
      function App(){ const [route,setRoute]=useState('/admin/course-enrollments'); const [open,setOpen]=useState(false); window.testPath=route;
        return <ThemeProvider attribute='class' defaultTheme='light'><main><button id='admin' onClick={()=>setRoute('/admin/course-enrollments')}>Admin</button><button id='mock' onClick={()=>setRoute('/mocks/test/attempt/test')}>Mock</button><button id='public' onClick={()=>setRoute('/courses')}>Public</button><button id='manage' onClick={()=>setOpen(true)}>Manage billing</button>{open&&<CourseBillingDialog target={{userId:'111111111111111111111111',courseId:'222222222222222222222222',action:'TERMINATE_REFUND'}} onClose={()=>setOpen(false)} onComplete={()=>{}}/>}</main></ThemeProvider>;
      } createRoot(document.getElementById('root')).render(<App/>);
    ` },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'mock-auth-and-routing', setup(build) {
      build.onResolve({ filter: /^(next\/navigation|@clerk\/nextjs|sonner)$/ }, args => ({ path: args.path, namespace: 'mock' }));
      build.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: args.path === 'next/navigation' ? 'export function usePathname(){return window.testPath}' : args.path === 'sonner' ? 'export const toast={success(){},warning(){},error(){}}' : 'const getToken=async()=>"mock-token"; export function useAuth(){return {getToken,userId:"mock-admin"}}', loader: 'js' }));
    } }],
  });
  const cssDir = path.join(process.cwd(), '.next/static/css');
  const css = fs.readdirSync(cssDir).filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join(cssDir, file), 'utf8')).join('\n');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/app.js' ? 'application/javascript' : 'text/html');
    res.end(req.url === '/app.js' ? bundle.outputFiles[0].contents : `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin regression fixture</title><style>${css}</style></head><body class="bg-background text-foreground"><div id="root"></div><script src="/app.js"></script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => localStorage.setItem('theme', 'light'));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    await page.click('#mock'); await page.waitForFunction(() => document.documentElement.classList.contains('light'));
    await page.click('#admin'); await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'light', 'Mock/admin transitions must not overwrite the saved theme');
    await page.click('#public'); await page.waitForFunction(() => document.documentElement.classList.contains('light'));
    await page.click('#admin'); await page.click('#manage'); await page.waitForSelector('#course-termination-reason');
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewport({ width, height: 900 });
      const box = await page.$eval('[role="dialog"]', element => { const box = element.getBoundingClientRect(); return { left: box.left, right: box.right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }; });
      assert.ok(box.left >= -1 && box.right <= width + 1 && box.scrollWidth <= box.clientWidth + 1, `Billing dialog must fit viewport ${width}: ${JSON.stringify(box)}`);
    }
    assert.equal(await page.$eval('button.bg-destructive', button => button.disabled), true);
    await page.type('#course-termination-reason', 'Customer requested refund');
    await page.type('#course-termination-confirmation', 'TERMINATE');
    await page.click('button.bg-destructive');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Retry same action'));
    await page.click('[role="dialog"] button[data-slot="dialog-close"]');
    await page.click('#manage'); await page.waitForSelector('#course-termination-reason');
    assert.equal(await page.$eval('#course-termination-reason', input => input.disabled), true);
    await page.click('button.bg-destructive'); await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('refund processed'));
    const calls = await page.evaluate(() => window.calls);
    assert.equal(calls.length, 2); assert.deepEqual(calls[0], calls[1], 'Reopened dialog must retry the exact saved financial request');
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: admin/mock/public theme transitions, four viewport sizes, confirmation gating and exact financial retry. All APIs mocked.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
