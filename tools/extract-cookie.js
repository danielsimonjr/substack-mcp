const { chromium } = require('playwright');

async function extractSubstackCookie() {
  console.log('🚀 Starting Substack cookie extraction...\n');
  
  const browser = await chromium.launch({
    headless: false, // Show browser so user can login
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📖 Opening Substack login page...');
  await page.goto('https://substack.com/sign-in');
  
  console.log('\n⏳ Please login to Substack in the browser window...');
  console.log('   After logging in, press Enter in this terminal...\n');
  
  // Wait for user to press Enter
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
  
  console.log('🔍 Extracting cookies...\n');
  
  // Get all cookies
  const cookies = await context.cookies();
  
  // Find connect.sid cookie
  const connectSidCookie = cookies.find(cookie => cookie.name === 'connect.sid');
  
  if (connectSidCookie) {
    console.log('✅ Successfully found connect.sid cookie!\n');
    console.log('━'.repeat(80));
    console.log('Cookie Value:');
    console.log(connectSidCookie.value);
    console.log('━'.repeat(80));
    console.log('\n📋 Copy the value above and update your Claude Desktop config:');
    console.log('   SUBSTACK_API_KEY=<paste-cookie-value-here>\n');
    
    // Also save to a file
    const fs = require('fs');
    fs.writeFileSync(
      '/c/mcp-servers/substack-mcp/tools/cookie.txt',
      connectSidCookie.value
    );
    console.log('💾 Cookie also saved to: C:\mcp-servers\substack-mcp\tools\cookie.txt\n');
  } else {
    console.log('❌ Could not find connect.sid cookie.');
    console.log('   Make sure you are logged into Substack.\n');
  }
  
  await browser.close();
  console.log('👋 Browser closed. Done!');
}

extractSubstackCookie().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
