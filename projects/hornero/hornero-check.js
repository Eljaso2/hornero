const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE ERROR: ' + msg.text());
  });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));
  
  try {
    await page.goto('http://localhost:8765/app-ho.html', {waitUntil: 'networkidle', timeout: 15000});
    await page.waitForTimeout(3000); // wait for custom elements to register
    
    // Take screenshot
    await page.screenshot({path: '/tmp/hornero-screen.png', fullPage: true});
    
    // Check if custom elements are defined
    const defined = await page.evaluate(() => {
      return ['hornero-app', 'hornero-home', 'hornero-contenido', 'hornero-chat'].map(name => 
        name + ': ' + customElements.get(name)?.name
      );
    });
    
    console.log('=== Custom Elements ===');
    defined.forEach(d => console.log(d));
    
    console.log('\n=== Errors ===');
    if (errors.length) errors.forEach(e => console.log(e));
    else console.log('No errors found');
    
    // Check for grey/blank screen
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('\n=== Body bg: ' + bgColor + ' ===');
    
  } catch(e) {
    console.log('NAVIGATION ERROR: ' + e.message);
  }
  
  await browser.close();
})();
