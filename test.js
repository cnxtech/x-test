const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ timeout: 10000 });
    const page = await browser.newPage();

    // Before navigation, start mapping browser logs to stdout.
    page.on('console', message => console.log(message.text()));

    // Visit our test page.
    await page.goto('http://127.0.0.1:8080/?x-test-no-reporter');

    // Wait to be signaled about the end of the test. Because the test may have
    // not started, already started, or already ended, ping for status.
    await page.evaluate(async () => {
      return new Promise(resolve => {
        const onMessage = evt => {
          const { type, data } = evt.data;
          if (
            type === 'x-test-ended' ||
            (type === 'x-test-pong' && data.ended)
          ) {
            top.removeEventListener('message', onMessage);
            resolve();
          }
        };
        top.addEventListener('message', onMessage);
        top.postMessage({ type: 'x-test-ping' }, '*');
      });
    });

    await browser.close();
  } catch (err) {
    // Ensure we exit with a non-zero code if anything fails (e.g., timeout).
    console.error(err);
    process.exit(1);
  }
})();
