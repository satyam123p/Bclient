import { initializeUi, DOM,exitRoom, addOutgoingMessageToUi} from "./modules/uiUtils.js";
import * as ws from "./modules/ws.js";
import * as ajax from "./modules/ajax.js";
import * as state from "./modules/state.js";
import * as webRTCHandler from "./modules/webRTCHandler.js";

// Generate unique user code for every user that visits the page
const userId = Math.round(Math.random() * 1000000);

// initialize the DOM
initializeUi(userId);

// establish a ws connection
const wsClientConnection = new WebSocket(`ws://107.109.204.190:8080/?userId=${userId}`);

// pass all of our websocket logic to another module
ws.registerSocketEvents(wsClientConnection);

// create room
DOM.createRoomButton.addEventListener("click", () => {
   const roomName = DOM.inputRoomNameElement.value;
   DOM.inputRoomNameElement.value="";
   if(!roomName) {
    return alert("Your room needs a name");
   };
   ajax.createRoom(roomName, userId);
});
DOM.destroyRoomButton.addEventListener("click", () => {
   const roomName = state.getState().roomName;
   ajax.destroyRoom(roomName);
})
DOM.joinRoomButton.addEventListener("click", () => {
   const roomName = DOM.inputRoomNameElement.value; 
   DOM.inputRoomNameElement.value="";
   if(!roomName) {
      return alert("You have to join a room with a valid name");
   }
   ws.joinRoom(roomName, userId, wsClientConnection);
});
DOM.exitButton.addEventListener("click", () => {
   const roomName = state.getState().roomName;
   exitRoom();
   ws.exitRoom(roomName, userId);
   webRTCHandler.closePeerConnection();
});
DOM.sendMessageButton.addEventListener("click", () => {
   const message = DOM.messageInputField.value.trim();
   DOM.messageInputField.value="";
   if(message){
      addOutgoingMessageToUi(message);
      webRTCHandler.sendMessageUsingDataChannel(message);
   };
});
