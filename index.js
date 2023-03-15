const { response } = require('express');
const express = require('express');
const { IncomingMessage } = require('http');
const { readFile } = require('fs').promises;
const { Configuration, OpenAIApi } = require("openai");
const { apiKey } = require('./api_key.js');
const app = express();

const configuration = new Configuration({
    apiKey: apiKey,
});

//TEST STARt
async function testCompletion() {
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ 'role': "user", "content": "How are you?" }],
    });
    console.log(completion.data.choices[0].message);
}
// Call the async function
//testCompletion();
//TEST END

async function getCompletion(inputMessage) {
    const openai = new OpenAIApi(configuration);
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ 'role': "user", "content": inputMessage }],
    });
    console.log(completion.data.choices[0].message)
    console.log("API Call sucessfull")
    return completion.data.choices[0].message;
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

app.listen(process.env.PORT || 3000, () => console.log('App available at http://localhost:3000'))
