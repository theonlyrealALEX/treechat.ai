const { response } = require('express');
const express = require('express');
const { IncomingMessage, request } = require('http');
const { readFile } = require('fs').promises;
const { Configuration, OpenAIApi } = require("openai");
const { apiKey } = require('./api_key.js');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
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

const setUpCommandPA = fs.readFileSync('set_up_command', 'utf8', (err, data) => {
    if (err) {
        console.error('An error occurred while reading the Command file:', err);
        return;
    }
});

const commandDB = { "PasingerArcaden": { 'data': dataPA, 'setUpCommand': setUpCommandPA } }

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

async function saveSessionDataToCSV(filePath, sessionDataArray) {
    const existingData = await fs.promises.readFile(filePath, 'utf8').catch((err) => {
        console.error('Error reading the CSV file:', err);
    });

    const existingLines = existingData.split('\n');

    const dataToSave = sessionDataArray
        .filter(({ sessionID }) => sessionID !== 'sID') // Exclude session data with sessionID equal to 'sID'
        .flatMap(({ sessionID, messages }) => {
            return messages
                .filter(msg => msg.role !== 'system') // Filter out system messages
                .map(msg => ({ line: `"${sessionID}","${msg.role}","${msg.content.replace(/"/g, '""')}"`, sessionID }));
        })
        .filter(({ line }) => !existingLines.includes(line)) // Filter out lines already in the CSV
        .map(({ line }) => line)
        .join('\n');

    if (dataToSave.length > 0) {
        fs.appendFile(filePath, `\n${dataToSave}`, (err) => {
            if (err) {
                console.error('Error while appending data to file:', err);
            } else {
                console.log('Data appended successfully');
            }
        });
    } else {
        console.log('No new data to append');
    }
}









var initialMessage = async function (intialMessageDirectory) {
    try {
        return [
            { 'role': "system", "content": commandDB[intialMessageDirectory]['setUpCommand'] },
            { 'role': "system", "content": commandDB[intialMessageDirectory]['data'] }
        ];
    } catch {
        console.log("Error in reading intialMessage");
    }
};

async function getCompletion(inputMessage, sID, location) {
    const openai = new OpenAIApi(configuration);
    try {
        old_message = sessionDB[sID];
        old_message.push({ 'role': "user", "content": inputMessage });
        sessionDB[sID] = old_message;
    } catch {
        const initialMessages = await initialMessage(location);
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
        response.send(await readFile('./pasingerarcaden.html', 'utf8'));
    } catch {
        console.error('An error occurred:', error.message);
        response.status(500).send('An error occurred while loading the page. Please try again later.');
    }
});

app.get('/pasingerarcaden', async (request, response) => {
    try {
        response.send(await readFile('./pasingerarcaden.html', 'utf8'));
    } catch {
        console.error('An error occurred:', error.message);
        response.status(500).send('An error occurred while loading the page. Please try again later.');
    }
});

app.post('/pasingerarcaden/input', async (request, response) => {
    if (!request.body) {
        response.status(400).send();
        return;
    }
    try {
        const completionMessage = await getCompletion(request.body['input']['value'], request.body['sessionID'], 'PasingerArcaden');
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

//var sessionDB = { sID: { 'role': "user", "content": "Repeat: How can I help you?" } };
var sessionDB = { sID: [{ 'role': "user", "content": "Repeat: How can I help you?" }] };


app.get('/downloadsessionfile', async (request, response) => {
    try {
        const sessionDBFilePath = 'sessionData.csv';
        if (!fs.existsSync(sessionDBFilePath)) {
            response.status(404).send('Session file not found');
            return;
        }

        response.setHeader('Content-Disposition', `attachment; filename=${path.basename(sessionDBFilePath)}`);
        response.setHeader('Content-Type', 'text/csv');

        const readStream = fs.createReadStream(sessionDBFilePath);
        readStream.pipe(response);

        console.log("Session file downloaded");
    } catch (error) {
        console.error('An error occurred while downloading the session file:', error.message);
        response.status(500).send('An error occurred while downloading the session file. Please try again later.');
    }
});


const sessionDataSaveInterval = 60 * 60 * 1000;
setInterval(() => {
    const sessionDataArray = Object.entries(sessionDB).map(([sessionID, messages]) => {
        return { sessionID, messages };
    });
    saveSessionDataToCSV('sessionData.csv', sessionDataArray);
}, sessionDataSaveInterval);





function handleExit() {
    console.log('Terminating server...');
    const sessionDataArray = Object.entries(sessionDB).map(([sessionID, messages]) => {
        return { sessionID, messages };
    });
    saveSessionDataToCSV('sessionData.csv', sessionDataArray);
    process.exit();
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
try {
    app.listen(process.env.PORT || 3001, () => console.log('App available at http://localhost:3001'))
} catch {
    throw err('Can not start app.listen()');
}
