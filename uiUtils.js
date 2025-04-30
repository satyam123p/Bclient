import * as state from "./state.js";
const inputRoomNameElement = document.getElementById('input_room_channel_name');
const joinRoomButton = document.getElementById('join_button');
const createRoomButton = document.getElementById('create_room_button');
const messageInputField = document.getElementById('message_input_field');
const sendMessageButton = document.getElementById('send_message_button');
const destroyRoomButton = document.getElementById('destroy_button');
const exitButton = document.getElementById('exit_button');
const messageContainer = document.getElementById("message-container");
export const DOM = {
    createRoomButton,
    inputRoomNameElement,
    destroyRoomButton,
    joinRoomButton,
    exitButton,
    sendMessageButton,
    messageInputField,
}
export function initializeUi(userId) {
    state.setUserId(userId);
}
export function exitRoom() {
    inputRoomNameElement.value = '';
    state.resetState();
}
export function updateUiForRemainingUser() {
    alert("a user has left your room");
    state.setOtherUserId(null);
}
export function addOutgoingMessageToUi(message) {
    const userTag = "YOU";
    const formattedMessage = `${userTag}: ${message}`;
    const p = document.createElement("p");
    p.textContent = formattedMessage;
    messageContainer.appendChild(p);
}
export function addIncomingMessageToUi(msg) {
    const otherUserId = state.getState().otherUserId;
    const formattedMessage = `${otherUserId}: ${msg}`;
    const p = document.createElement("p");
    p.textContent = formattedMessage;
    messageContainer.appendChild(p);
}
