import * as state from "./state.js";
import * as uiUtils from "./uiUtils.js";
import * as constants from "./constants.js";
import * as webRTCHandler from "./webRTCHandler.js";

// EVENT LISTENERS THAT THE BROWSER'S WEBSOCKET OBJECT GIVES US
export function registerSocketEvents(wsClientConnection) {
    // update our user state with this wsClientConnection
    state.setWsConnection(wsClientConnection);
    // listen for those 4 events
    wsClientConnection.onopen = () => {
        // tell the user that they have connected with our ws server
        console.log("You have connected with our websocket server");

        // register the remaining 3 events
        wsClientConnection.onmessage = handleMessage;
        wsClientConnection.onclose = handleClose;
        wsClientConnection.onerror = handleError;
    };
};

function handleClose() {
    console.log("You have been disconnected from our ws server");
};

function handleError() {
    console.log("An error was thrown while listening on onerror event on websocket");
}
export function joinRoom(roomName, userId) {
    const message = {
        label: constants.labels.NORMAL_SERVER_PROCESS,
        data: {
            type: constants.type.ROOM_JOIN.REQUEST,
            roomName,
            userId
        }
    };
    state.getState().userWebSocketConnection.send(JSON.stringify(message));
}
export function exitRoom(roomName, userId) {
    const message = {
        label: constants.labels.NORMAL_SERVER_PROCESS,
        data: {
            type: constants.type.ROOM_EXIT.REQUEST,
            roomName,
            userId
        }
    };
    state.getState().userWebSocketConnection.send(JSON.stringify(message));
}
export function sendOffer(offer) {
    const message = {
        label: constants.labels.WEBRTC_PROCESS,
        data: {
            type: constants.type.WEB_RTC.OFFER,
            offer, 
            otherUserId: state.getState().otherUserId
        }
    };
    state.getState().userWebSocketConnection.send(JSON.stringify(message));
};

// OUTGOING:SENDING AN ANSWER BACK TO THE SIGNALING SERVER
export function sendAnswer(answer) {
    const message = {
        label: constants.labels.WEBRTC_PROCESS, 
        data: {
            type: constants.type.WEB_RTC.ANSWER,
            answer, 
            otherUserId: state.getState().otherUserId
        }
    };
    state.getState().userWebSocketConnection.send(JSON.stringify(message));
};

// OUTGOING:SENDING ICE CANDIDATES TO THE OTHER PEER
export function sendIceCandidates(arrayOfIceCandidates) {
    const message = {
        label: constants.labels.WEBRTC_PROCESS,
        data: {
            type: constants.type.WEB_RTC.ICE_CANDIDATES,
            candidatesArray: arrayOfIceCandidates,
            otherUserId: state.getState().otherUserId
        }
    };
    state.getState().userWebSocketConnection.send(JSON.stringify(message));
};

// ############## INCOMING WEBSOCKET MESSAGES
function handleMessage(incomingMessageEventObject) {
    const message = JSON.parse(incomingMessageEventObject.data);
    // process an incoming message depending on its label
    switch(message.label) {
        // NORMAL SERVER STUFF
        case constants.labels.NORMAL_SERVER_PROCESS:
            normalServerProcessing(message.data);
            break;
        // WEBRTC SERVER STUFF
        case constants.labels.WEBRTC_PROCESS:
            webRTCServerProcessing(message.data);
            break;
        default: 
            console.log("unknown server processing label: ", message.label);
    }
};
function normalServerProcessing(data) {
    // process the message depending on its data type
    switch(data.type) {
        // join room - success
        case constants.type.ROOM_JOIN.RESPONSE_SUCCESS: 
            joinSuccessHandler(data);
            alert("Join room successful");
            break; 
        // join room - failure
        case constants.type.ROOM_JOIN.RESPONSE_FAILURE: 
            console.log("join room failed");
            break; 
        // join room - notification
        case constants.type.ROOM_JOIN.NOTIFY: 
            joinNotificationHandler(data);
            break; 
        // exit room - notification
        case constants.type.ROOM_EXIT.NOTIFY:
            exitNotificationHandler(data);
            break;
        // disconnection - notification
        case constants.type.ROOM_DISONNECTION.NOTIFY:
            exitNotificationHandler(data);
            break;
        // catch-all
        default: 
            console.log("unknown data type: ", data.type);
    }
};

function webRTCServerProcessing(data) {
    switch(data.type) {
        case constants.type.WEB_RTC.OFFER:
            webRTCHandler.handleOffer(data);
            break;
        case constants.type.WEB_RTC.ANSWER:
            webRTCHandler.handleAnswer(data);
            break; 
        case constants.type.WEB_RTC.ICE_CANDIDATES:
            webRTCHandler.handleIceCandidates(data);
            break; 
        default: 
            console.log("Unknown data type: ", data.type);
    }
};
function joinSuccessHandler(data) {
    state.setOtherUserId(data.creatorId);
    state.setRoomName(data.roomName);
    webRTCHandler.startWebRTCProcess(); 
}
function joinNotificationHandler(data) {
    alert(`User ${data.joinUserId} has joined your room`);
    state.setOtherUserId(data.joinUserId);
}
function exitNotificationHandler(data) {
    uiUtils.updateUiForRemainingUser();
    webRTCHandler.closePeerConnection();
}
