const { response } = require('express');
const express = require('express');
const { IncomingMessage } = require('http');
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

var initialMessage = async function () {
    return [
        { 'role': "user", "content": setUpCommand },
        { 'role': "user", "content": dataPA }
    ];
};

async function getCompletion(inputMessage) {
    const openai = new OpenAIApi(configuration);

    const messages = await initialMessage(); // Call the initialMessage function and await its result
    messages.push({ 'role': "user", "content": inputMessage }); // Now you can use push() on the returned array

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });

    console.log(completion.data.choices[0].message);
    console.log("API Call successful");
    return completion.data.choices[0].message;
}
function generateSessionId() {
    const timestamp = new Date().getTime();
    const randomNum = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomNum}`;
}


app.use(express.json())

app.get('/', async (request, response) => {
    response.send(await readFile('./home.html', 'utf8'));
});

app.post('/input', async (request, response) => {
    console.log(request.body['value'])
    if (!request.body) {
        response.status(418).send();
        return;
    }
    const completionMessage = await getCompletion(request.body['value']);
    response.send(completionMessage);
    console.log("API response sucessfully sent out")
});

app.get('/getSessionID', async (request, response) => {
    const sessionId = generateSessionId();
    console.log('Session ID:', sessionId);
    response.send(sessionId);
})

app.listen(process.env.PORT || 3001, () => console.log('App available at http://localhost:3001'))
