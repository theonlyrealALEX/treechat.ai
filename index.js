const { response } = require('express');
const express = require('express');
const fs = require('fs');
const { readFile } = require('fs').promises;
const path = require('path');
const { IncomingMessage, request } = require('https');

//openAI
const { Configuration, OpenAIApi } = require("openai");
const { apiKey } = require('./api_key.js');

//express
const app = express();
const configuration = new Configuration({
    apiKey: apiKey,
});

//firebase:
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const firebaseDB = admin.firestore();

async function uploadToFirebase(sessionID, newData) {
    try {
        const sessionDocRef = firebaseDB.collection("sessionHistory").doc(sessionID);
        const sessionDoc = await sessionDocRef.get();

        let mergedData = newData;

        if (sessionDoc.exists) {
            mergedData = [...sessionDoc.data().messages, ...newData];
        }

        await sessionDocRef.set({ messages: mergedData });

        console.log("Data successfully uploaded to Firebase for session ID:", sessionID);
    } catch (error) {
        console.error("Error uploading data to Firebase:", error);
    }
}

function getData(location, type) {
    return fs.readFileSync('./modules/' + location + '/' + type, 'utf8', (err, data) => {
        if (err) {
            console.error('An error occurred while reading the Data file:', err);
            return;
        }
    });
}

const commandDB = { "PasingerArcaden": { 'data': getData('pasingerarcaden', 'data.csv'), 'setUpCommand': getData('pasingerarcaden', 'set_up_command') } }

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
        console.log("trying openAI API Call")
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: sessionDB[sID],
        });
        console.log("openAI API Call successful");
        old_message = sessionDB[sID];
        old_message.push(completion.data.choices[0].message);
        sessionDB[sID] = old_message;
        const nonSystemMessages = sessionDB[sID].filter(message => message.role !== "system");
        uploadToFirebase(sID, nonSystemMessages);
        return completion.data.choices[0].message;
    } catch {
        throw new Err("Error in API-Call; check getCompletion()");
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
        response.send(await readFile('./modules/pasingerarcaden/pasingerarcaden.html', 'utf8'));
    } catch {
        console.error('An error occurred:', error.message);
        response.status(500).send('An error occurred while loading the page. Please try again later.');
    }
});

app.get('/pasingerarcaden', async (request, response) => {
    try {
        response.send(await readFile('./modules/pasingerarcaden/pasingerarcaden.html', 'utf8'));
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

app.get('/main.js', async (request, response) => {
    try {
        response.send(await readFile('./main.js', 'utf8'));
    } catch (error) {
        console.error('An error occurred:', error.message);
        response.status(500).send('An error occurred while loading the main.js file. Please try again later.');
    }
});


var sessionDB = { sID: [{ 'role': "user", "content": "Repeat: How can I help you?" }] };

try {
    app.listen(process.env.PORT || 3000, () => console.log('App available at https://localhost:3000'))
} catch {
    throw err('Can not start app.listen()');
}