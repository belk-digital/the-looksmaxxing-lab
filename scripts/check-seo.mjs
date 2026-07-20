import https from 'https';

function checkUrl(url) {
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  };

  https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\n--- Results for ${url} ---`);
      console.log('Status Code:', res.statusCode);
      if (res.statusCode >= 300 && res.statusCode < 400) {
        console.log('Redirects to:', res.headers.location);
      }
      console.log('Contains Age Verification Gate:', data.includes('Are you 21 years') ? 'YES' : 'NO');
      console.log('Contains HomePreloaderWrapper div:', data.includes('z-[999999]') ? 'YES' : 'NO');
    });
  }).on('error', err => {
    console.error(`Error fetching ${url}:`, err.message);
  });
}

checkUrl('https://thelooksmaxxinglab.com/');
checkUrl('https://www.thelooksmaxxinglab.com/');
