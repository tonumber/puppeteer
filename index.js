const input = require('input')
const fs = require('fs')
const rs = require('randomstring')
const {
    Worker,
    isMainThread,
    parentPort
} = require('worker_threads');
var cookies = require('./cookies.json')

if (isMainThread) {
    // This code is executed in the main thread and not in the worker.

    // Create the worker.
    (async() => {
        var count = await input.text('threads:')
        for (i = 0; i < parseInt(count); i++) {
            const worker = new Worker(__filename);
            worker.on('message', (msg) => {
                if (typeof msg == 'string' && msg.startsWith('COOKIE ')) {
                    cookies.push(JSON.parse(msg.replace('COOKIE ', '')))
                    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 4))
                } else console.log(msg);
            });
        }
    })()
    // Listen for messages from the worker and print them.
} else {
    require('events').EventEmitter.defaultMaxListeners = 20;

    console.working = function(text) {
            parentPort.postMessage(`${clc.green('[WORKING] -')} ${text}`)
        }
        // This code is executed in the worker and not in the main thread.

    // Send a message to the main thread.
    const clc = require('cli-color')
    const puppeteer = require('puppeteer-extra')

    // add stealth plugin and use defaults (all evasion techniques)
    const StealthPlugin = require('puppeteer-extra-plugin-stealth')
    puppeteer.use(StealthPlugin())
        // const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
    console.log(clc.yellow('[INFO] - ') + '   Bot started.')

    function randomFromRange(start, end) {
        return Math.round(Math.random() * (end - start) + start);
    }

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    // ... puppeteer code

    run()

    async function run() {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"','--no-sandbox', '--disable-setuid-sandbox']
            });
            var page = await browser.pages().then(r => {
                return r[0]
            })
            await page.setViewport({ width: 1920, height: 1080 })
            await page.goto('https://repl.it/signup')

            console.working(`Navigated to create repl account page.`)

            await page.exposeFunction('postMessage', (m) => {
                parentPort.postMessage(m)
            })

            await page.exposeFunction('sleep', async(ms) => {
                return new Promise((resolve) => {
                    setTimeout(resolve, ms);
                });
            })

            const things = await page.$$('input')
            var prevX = 1920 / 2
            var prevY = 1080 / 2

            function translate(x, y) {
                var left = parseInt(prevX),
                    top = parseInt(prevY),
                    dx = left - x,
                    dy = top - y,
                    i = 1,
                    count = 250,
                    delay = 2;

                function loop() {
                    if (i >= count) {
                        return
                    }
                    i += 1;
                    page.mouse.move(
                        Math.floor(left - (dx * i) / count),
                        Math.floor(top - (dy * i) / count)
                    );
                    setTimeout(loop, delay);
                }

                loop();
            }
            translate(Math.floor(Math.random() * 1920), Math.floor(Math.random() * 1080))
            var uname = rs.generate(15)
            await things[0].focus()
            await sleep(500)
            await page.keyboard.type(uname)
            console.working('Made account with name ' + clc.blue(uname))
            await sleep(500)
            await things[1].focus()
            await sleep(500)
            await page.keyboard.type(rs.generate(20) + '@gmail.com')
            await sleep(500)
            await things[2].focus()
            await sleep(500)
            await page.keyboard.type(rs.generate(20))
            await sleep(300)
            var button = await page.$('button')
            var oldUrl = page.url()
            await button.click()
            await sleep(3000)
            if (oldUrl != page.url()) {
                await page.cookies().then(cookies => {
                    cookies.forEach(cookie => {
                        if (cookie.name == 'connect.sid') {
                            parentPort.postMessage('COOKIE ' + JSON.stringify({
                                value: cookie.value,
                                expires: new Date(new Date(cookie.expires).getUnixTime() * 1000).toLocaleString("en-US", { timeZoneName: "short" })
                            }))
                        }
                    })
                })
            }
            await page.close()
            parentPort.postMessage(`${clc.green('[WORKING] -')} Made account and closed Browser.`)
            run()
        } catch (e) {
            try {
                await page.close()
            } catch (e) {}
            parentPort.postMessage(e)
            parentPort.postMessage(clc.red('[ERROR | RESTARTING]\t') + 'Something happened and the puppeteer instance threw an error.')
            run()
        }
    }
}
