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
});

const setUpCommand = fs.readFileSync('set_up_command', 'utf8', (err, data) => {
    if (err) {
        console.error('An error occurred while reading the Command file:', err);
        return;
    }
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
    try {
        return [
            { 'role': "system", "content": setUpCommand },
            { 'role': "system", "content": dataPA }
        ];
    } catch {
        console.log("Error in reading intialMessage; Check setUpCommand and dataPA");
    }
};

async function getCompletion(inputMessage, sID) {
    const openai = new OpenAIApi(configuration);
    try {
        old_message = sessionDB[sID];
        old_message.push({ 'role': "user", "content": inputMessage });
        sessionDB[sID] = old_message;
    } catch {
        const initialMessages = await initialMessage();
        initialMessages.push({ 'role': "user", "content": inputMessage });
        sessionDB[sID] = initialMessages;
    }
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: sessionDB[sID],
        });
        console.log("openAI API Call successful");
        old_message = sessionDB[sID];
        old_message.push(completion.data.choices[0].message);
        sessionDB[sID] = old_message;
        return completion.data.choices[0].message;
    } catch {
        throw new Err("Error in API-Call; check getCompletion()s");
    }
}
function generateID() {
    const timestamp = new Date().getTime();
    const randomNum = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomNum}`;
}

app.use(express.json())

app.get('/', async (request, response) => {
    try {
        response.send(await readFile('./home.html', 'utf8'));
    } catch {
        console.error('An error occurred:', error.message);
        response.status(500).send('An error occurred while loading the page. Please try again later.');
    }
});

app.post('/input', async (request, response) => {
    if (!request.body) {
        response.status(400).send();
        return;
    }
    try {
        const completionMessage = await getCompletion(request.body['input']['value'], request.body['sessionID']);
        response.send(completionMessage);
        console.log("Response sucessfully sent out")
    } catch {
        response.status(500).send('An error occurred while loading the answer. Please try again later.');
    }

});

app.get('/getSessionID', async (request, response) => {
    try {
        const sessionId = generateID();
        response.send(sessionId);
        console.log('Session ID sent to User:', sessionId);
    } catch {
        response.status(500).send('An error occurred while loading the sessionID. Please try again later.');
    }
})

app.get('/getUserID', async (request, response) => {
    try {
        const userID = generateID();
        response.send(userID);
        console.log('UserID sent to User:', userID);
    } catch {
        response.status(500).send('An error occurred while loading the sessionID. Please try again later.');
    }
})

app.get('/stylesheet.css', async (request, response) => {
    try {
        response.send(styleSheet);
        console.log("Supplied Style Sheet");
    } catch {
        response.status(500).send('An error occurred while loading the answer. Please try again later.');
    }
})

app.get('/default_theme.css', async (request, response) => {
    try {
        response.send(defaultTheme);
        console.log("Supplied Style Sheet");
    } catch {
        response.status(500).send('An error occurred while loading the answer. Please try again later.');
    }
})

var sessionDB = { sID: { 'role': "user", "content": "Repeat: How can I help you?" } };

try {
    app.listen(process.env.PORT || 3001, () => console.log('App available at http://localhost:3001'))
} catch {
    throw err('Can not start app.listen');
}
