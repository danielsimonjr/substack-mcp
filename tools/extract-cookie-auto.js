const { chromium } = require('playwright');

async function extractSubstackCookie() {
  console.log('🚀 Starting Substack cookie extraction...\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📖 Opening Substack login page...');
  await page.goto('https://substack.com/sign-in');
  
  console.log('\n⏳ Waiting for you to login...');
  console.log('   (Automatically detecting when you are logged in)\n');
  
  // Wait for either:
  // 1. URL to change from sign-in page (indicating login success)
  // 2. The presence of connect.sid cookie
  // 3. Maximum 5 minutes timeout
  
  const timeout = 300000; // 5 minutes
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // Check if we have the cookie
    const cookies = await context.cookies();
    const connectSidCookie = cookies.find(cookie => cookie.name === 'connect.sid');
    
    // Check if URL changed from sign-in
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('sign-in') || connectSidCookie;
    
    if (isLoggedIn && connectSidCookie) {
      console.log('✅ Login detected! Extracting cookie...\n');
      
      console.log('━'.repeat(80));
      console.log('Cookie Value:');
      console.log(connectSidCookie.value);
      console.log('━'.repeat(80));
      console.log('\n📋 Cookie will be automatically configured...\n');
      
      // Save to file
      const fs = require('fs');
      fs.writeFileSync(
        'C:/mcp-servers/substack-mcp/tools/cookie.txt',
        connectSidCookie.value
      );
      console.log('💾 Cookie saved to: C:\mcp-servers\substack-mcp\tools\cookie.txt\n');
      
      await browser.close();
      console.log('👋 Browser closed. Done!');
      return connectSidCookie.value;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('❌ Timeout: Could not detect login after 5 minutes.');
  await browser.close();
  return null;
}

extractSubstackCookie().then(cookie => {
  if (cookie) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
