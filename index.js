/* Desine sperare qui hic intras */

const config = require('./config.json');
const TwitchBot = require('twitch-bot');
const chromedriver = require('chromedriver');
let chrome = require('selenium-webdriver/chrome');
const {Builder, Key} = require('selenium-webdriver');
const stdin = process.openStdin();
const bot = new TwitchBot(config.bot)

let driver

// Runtime configurations

let isEnable = false

// Bot section

bot.on('join', channel => {
    console.log(`Joined channel: ${channel}`)
});
  
bot.on('error', err => {
    console.log('Bot error:' + err)
});

bot.on('message', chatter => {
    if (checkOn(chatter.message, config.help_commands)) {
        bot.say(`Hi TheIlluminati Following commands are available: ${config.help_commands.join(', ')} - You are here; ${config.up_commands.join(', ')} - To make Dino jump; ${config.down_commands.join(', ')} - To make Dino duck.`);
    }
    if (checkOn(chatter.message, config.up_commands) && isEnable) {
        sendKey(Key.UP);
    }
    if (checkOn(chatter.message, config.down_commands) && isEnable) {
        sendKey(Key.DOWN);
    }
});

// Process section

process.addListener('exit', async function q() {
    await driver.quit();
});

stdin.addListener("data", data => {
    let cmd = `${data}`.trim();
    if (checkOn(cmd, config.up_commands) && isEnable) {
        sendKey(Key.UP);
        evalJS("Runner.instance_.setSpeed(1)");
    }
    if (checkOn(cmd, config.down_commands) && isEnable) {
        sendKey(Key.DOWN);
    }
    if (cmd === 'status') {
        console.log(`Current status: ${isEnable ? 'running' : 'stopped'}`)
    }
    if (cmd === 'run') {
        if (isEnable) {
            console.log("Already is running")
        } else {
            isEnable = true
            bot.say("Heya, send !help for get help Kappa ");
            console.log('Handling is running')
        }
    }
    if (cmd === 'stop') {
        if (!isEnable) {
            console.log("Already is stopped")
        } else {
            isEnable = false
            console.log('Handling is stopped')
        }
    }
    if (cmd === "restart") {
        evalJS("Runner.instance_.restart()");
    }
    if (cmd.startsWith('m ')) {
        bot.say(cmd.substring(2), false, i => {
            if (i.send) {
                console.log('Message is sent');
            }
            else {
                console.log(`Message send error: ${i.message}`);
            }
        });
    }
});

// Misc functions

function checkOn(message, commands) {
    return commands.includes(message)
}

function getRandSleepForKey() {
    return Math.random() * (400 - 300) + 300;
}

async function sendKey(key) {
    if (driver !== undefined) {
        try {
            await driver.actions().keyDown(key).perform();
            await driver.sleep(getRandSleepForKey());
            await driver.actions().keyUp(key).perform();
        } catch (err) {
            console.log('Action key error: ' + err)
        }
    }
    else {
        console.log('Action key error: driver not inicialized.')
    }
}

async function evalJS(js) {
    if (driver !== undefined) {
        try {
            await driver.executeScript(js);
        } catch (err) {
            console.log('Action JS eval error: ' + err)
        }
    }
    else {
        console.log('Action JS eval error: driver not inicialized.')
    }
}
 
// Init section

(async function init() {
    chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().windowSize({width: config.width, height: config.height}))
        .build();
    try {
        await driver.get('chrome://dino');
        await driver.sleep(1000);
        await driver.executeScript("Runner.instance_.playIntro()");
        await driver.executeScript("Runner.instance_.gameOver()");
    } catch (err) {
        console.log('Init selenium error:', err)
        await driver.quit();
        process.exit(1);
    }
})();

setInterval(() => {
    if (isEnable) {
        bot.say("Heya, send !help for get help Kappa ");
    }
}, 300000);