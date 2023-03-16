const { response } = require('express');
const express = require('express');
const { IncomingMessage, request } = require('http');
const { readFile } = require('fs').promises;
const { Configuration, OpenAIApi } = require("openai");
const { apiKey } = require('./api_key.js');
const fs = require('fs');
const app = express();
const configuration = new Configuration({
    apiKey: apiKey,
});

const dataPA = fs.readFileSync('data.csv', 'utf8', (err, data) => {
    if (err) {
        console.error('An error occurred while reading the Data file:', err);
        return;
    }
    //
});

const setUpCommand = fs.readFileSync('set_up_command', 'utf8', (err, data) => {
    if (err) {
        console.error('An error occurred while reading the Command file:', err);
        return;
    }
    //
});

const styleSheet = fs.readFileSync('stylesheet.css', 'utf8', (err, data) => {
    if (err) {
        console.error('An error occurred while reading the Stylesheet file:', err);
        return;
    }
});

const defaultTheme = fs.readFileSync('default_theme.css', 'utf8', (err, data) => {
    if (err) {
        console.error('An error occurred while reading the Stylesheet file:', err);
        return;
    }
});

var initialMessage = async function () {
    return [
        { 'role': "user", "content": setUpCommand },
        { 'role': "user", "content": dataPA }
    ];
};

async function getCompletion(inputMessage, sID) {
    const openai = new OpenAIApi(configuration);

    console.log("getCompletion Args:", inputMessage, sID)

    let tmpMessage;

    if (!sessionDB[sID]) {
        const initialMessages = await initialMessage();
        initialMessages.push({ 'role': "user", "content": inputMessage });
        sessionDB[sID] = initialMessages;
    } else {
        old_message = sessionDB[sID];
        old_message.push({ 'role': "user", "content": inputMessage });
        sessionDB[sID] = old_message;
    }

    /*
    const messages = await initialMessage();
    messages.push({ 'role': "user", "content": inputMessage });
    console.log("messages structure:");
    console.log(messages);
    */

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: sessionDB[sID],
    });

    console.log("API Call successful");
    old_message = sessionDB[sID];

    old_message.push(completion.data.choices[0].message);
    sessionDB[sID] = old_message;
    //console.log(sessionDB[sID], sID)

    return completion.data.choices[0].message;
}
function generateID() {
    const timestamp = new Date().getTime();
    const randomNum = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomNum}`;
}


app.use(express.json())

app.get('/', async (request, response) => {
    response.send(await readFile('./home.html', 'utf8'));
});

app.post('/input', async (request, response) => {
    //console.log(request.body)
    if (!request.body) {
        response.status(418).send();
        return;
    }
    console.log('Body:', request.body)
    console.log("sessionID: ", request.body['sessionID']);
    console.log("userID: ", request.body['userID']);
    console.log(request.body['input']['value']);
    const completionMessage = await getCompletion(request.body['input']['value'], request.body['sessionID']);
    response.send(completionMessage);
    console.log("API response sucessfully sent out")
});

app.get('/getSessionID', async (request, response) => {
    const sessionId = generateID();
    response.send(sessionId);
    console.log('Session ID sent to User:', sessionId);
})

app.get('/getUserID', async (request, response) => {
    const userID = generateID();
    response.send(userID);
    console.log('UserID sent to User:', userID);
})

app.get('/stylesheet.css', async (request, response) => {
    response.send(styleSheet);
    console.log("Supplied Style Sheet");
})

app.get('/default_theme.css', async (request, response) => {
    response.send(defaultTheme);
    console.log("Supplied Style Sheet");
})

var sessionDB = { sID: { 'role': "user", "content": "Repeat: How can I help you?" } };

app.listen(process.env.PORT || 3001, () => console.log('App available at http://localhost:3001'))
