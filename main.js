if (window.location.pathname === "/") {
    window.location.replace(window.location.origin + "/pasingerarcaden");
}

var botui = new BotUI('Tree');
var chat_history = new String("")

var cookiesAccepted = true;
const emptyUserID = "emptyUserID";

function getMainWebsiteUrl() {
    const currentUrl = new URL(window.location.href);
    return currentUrl.protocol + '//' + currentUrl.host;
}

async function getSessionID() {
    try {
        getCookie("sessionID");
    } catch (err) {
        sID = await (async () => {
            try {
                const response = await fetch(getMainWebsiteUrl() + "/getSessionID");
                if (response.ok) {
                    console.log(response.text)
                    return await response.text();
                } else {
                    console.error("Error fetching session ID:", response.status, response.statusText);
                }
            } catch (err) {
                console.error("Error calling /getSessionID API:", err);
            }
        })();
        setCookie("sessionID", sID, 1);
    }
}

async function getUserID() {
    try {
        if (getCookie("userID") == "undefined") {
            throw new Error("undefined cookie")
        };
    } catch (err) {
        uID = await (async () => {
            try {
                const response = await fetch(getMainWebsiteUrl() + "/getUserID");
                if (response.ok) {
                    return await response.text();
                } else {
                    console.error("Error fetching user ID:", response.status, response.statusText);
                }
            } catch (err) {
                console.error("Error calling /getUserID API:", err);
            }
        })();
        setCookie("userID", uID, 365);
    }
}

async function getGPTResponse(input) {
    console.log(input);
    try {
        const uID = function () {
            if (cookiesAccepted) {
                return getCookie('userID');
            } else {
                return uemptyUserID;
            }
        }
        console.log("sending out API request")
        const response = await fetch(window.location.href + "/input", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input, sessionID: getCookie('sessionID'), userID: uID })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const searchName = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(searchName) === 0) {
            return cookie.substring(searchName.length, cookie.length);
        }
    }
    throw new Error("Cookie not found");
}

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

let loadingMessageIndex; // Add this new variable


function sendMessage() {
    botui.action.text({
        action: {
            placeholder: 'Enter your Question'
        }
    })
        .then((text) => {
            return botui.message.add({
                loading: true,
                human: false,
                content: "",
            }).then((index) => {
                loadingMessageIndex = index;
                return text;
            });
        })
        .then((text) => getGPTResponse(text))
        .then((gptOutput) => {
            const contentGPT = gptOutput['content']
            botui.message.update(loadingMessageIndex, {
                loading: false,
                human: false,
                content: contentGPT,
            }).then(() => {
                sendMessage();
            });
        })
}


function launchBot() {
    botui.message.bot({
        content: 'Stimmen Sie der Nutztung von Cookies zu?'
    })

        .then(() => {
            return botui.action.button({
                action: [
                    { text: 'Ja', value: true },
                    { text: 'Nein', value: false }, //change back to false in production sjjsjsj
                ]
            });
        })
        .then(function (cookieResponse) {
            if (!cookieResponse.value) {
                botui.message.add({
                    loading: false,
                    human: false,
                    content: "Ich kann leider ohne Cookies nicht funktionieren 😅",
                })
                throw err('Please Accept Cookies');
            }
        })
        .then(async function () {
            await getUserID();
            await getSessionID()
        })
        .then(function () {
            return botui.message.add({
                loading: true,
                human: false,
                content: "",
            }).then((index) => {
                loadingMessageIndex = index;
                return getGPTResponse({ type: 'text', value: 'Welcome the user to treechat.de. Introduce them to your assistance capabilities in relation to your Workplace. Keep it short. Use their language: ' + navigator.language || navigator.userLanguage });
            });
        })
        .then(gptOutput => {
            const contentGPT = gptOutput['content'];
            botui.message.update(loadingMessageIndex, {
                loading: false,
                human: false,
                content: contentGPT,
            }).then(() => {
                sendMessage();
            });
        })
}

try {
    launchBot();
} catch {
    console.log('I need cookies to work :/')
}