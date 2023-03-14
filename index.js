const { response } = require('express');
const express = require('express');
const { IncomingMessage } = require('http');
const { readFile } = require('fs').promises;

const app = express();
app.use(express.json())

app.get('/', async (request, response) => {
    response.send(await readFile('./home.html', 'utf8'));
});

app.post('/input', async (request, response) => {
    const { message } = request.body;
    console.log(message)
    //do chatgpt magic here with message :)
    if (!message) {
        response.status(418).send();
        return;
    }
    response.send({
        "answer": 'chatgptoutput'
    })
});

app.listen(process.env.PORT || 3000, () => console.log('App available at http://localhost:3000'))
