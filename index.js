const qrcode = require('qrcode-terminal');
const { Client, Location, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const request = require('request');
const e = require('express');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']},
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = 5100;

const webhookCallback = process.env.WEBHOOK

/**
 * Start initiate bot
 * 
 * this bunch of function is to initialize the bot before running
*/

app.listen(port, () => {     
    console.log(`Webhook target ${process.env.WEBHOOK}`);
    console.log(`Now listening on port ${port}`); 
});

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('wait a sec..', percent, message);
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});


client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

/**
 * END of initiate bot
*/



/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/message', multer().any(), async (request, response) => {
    let message = request.body.message;
    let phoneNumber = request.body.number;

    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    await client.sendMessage(number, message);
    return response.status(200).send('message sended');
});


/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/button', multer().any(), async (request, response) => {
    let message = request.body.message;
    let phoneNumber = request.body.number;
    let title = request.body.title;
    let footer = request.body.footer;
    let buttons = JSON.parse(request.body.buttons);

    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    
    const buttons_reply = new Buttons(message, buttons, title, footer)
    
    // send to number
    for (const component of [buttons_reply]) await client.sendMessage(number, component);

    return response.status(200).send('message sended');
});

/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/list', multer().any(), async (request, response) => {
    let message = request.body.message;
    let phoneNumber = request.body.number;

    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }

    const section = {
    title: 'test',
    rows: [
        {
        title: 'Test 1',
        },
        {
        title: 'Test 2',
        id: 'test-2'
        },
        {
        title: 'Test 3',
        description: 'This is a smaller text field, a description'
        },
        {
        title: 'Test 4',
        description: 'This is a smaller text field, a description',
        id: 'test-4',
        }
    ],
    };

    const list = new List('test', 'click me', [section], 'title', 'footer')
    await client.sendMessage(number, list);
    return response.status(200).send('message sended');
});


client.on('message', async msg => {
    let clientServerOptions = {
        uri: webhookCallback,
        body: JSON.stringify(msg),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    request(clientServerOptions, function (error, response) {
        if (!error && (response && response.statusCode) === 200) {
            console.log("success");
            return 200;
        }else{
            console.log(error,response);
            return 500;
        }
    });
});
