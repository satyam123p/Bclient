import * as uiUtils from "./uiUtils.js";
import * as ws from "./ws.js";
let pc;
let dataChannel;
const iceCandidatesGenerated = [];
const iceCandidatesReceivedBuffer = [];
const webRTCConfiguratons = {
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ]
        }
    ]
}
export function startWebRTCProcess() {
    let offer;

    createPeerConnectionObject();
    createDataChannel(true);

    pc.createOffer().then(function(createdOffer) {
        offer = createdOffer;
        return pc.setLocalDescription(offer);
    }).then(function() {
        ws.sendOffer(offer);
    }).catch(function(error) {
        console.error('Error occurred during WebRTC process:', error);
    });
}
function createPeerConnectionObject() {
    pc = new RTCPeerConnection(webRTCConfiguratons);
    pc.addEventListener("connectionstatechange", () => {
        console.log("connection state changed to: ", pc.connectionState); 
        if(pc.connectionState === "connected") {
            alert("YOU HAVE DONE IT! A WEBRTC CONNECTION HAS BEEN MADE BETWEEN YOU AND THE OTHER PEER");
        }
    })
    pc.addEventListener("signalingstatechange", () => {
        console.log(`Signaling state changed to: ${pc.signalingState}`);
    })
    pc.addEventListener("icecandidate", (e) => {
        if(e.candidate) {
            console.log("ICE:", e.candidate);
            iceCandidatesGenerated.push(e.candidate);
        }
    })
}
function createDataChannel(isOfferor) {
    if (isOfferor) {
        const dataChannelOptions = {
            ordered: false, 
            maxRetransmits: 0
        };
        dataChannel = pc.createDataChannel("top-secret-chat-room", dataChannelOptions);
        registerDataChannelEventListeners();
    } 
    else {
        pc.ondatachannel = (e) => {
            console.log("The ondatachannel event was emitted for PEER2. Here is the event object: ", e);
            dataChannel = e.channel;
            registerDataChannelEventListeners();
        }
    }
}
function registerDataChannelEventListeners() {
    dataChannel.addEventListener("message", (e) => {
        console.log("message has been received from a Data Channel");
        const msg = e.data; 
        uiUtils.addIncomingMessageToUi(msg);
    });
    dataChannel.addEventListener("close", (e) => {
        console.log("The 'close' event was fired on your data channel object");
    });
    dataChannel.addEventListener("open", (e) => { 
        console.log("Data Channel has been opened. You are now ready to send/receive messsages over your Data Channel");
    });
}
export async function handleOffer(data) {
    let answer; 
    createPeerConnectionObject(); 
    createDataChannel(false);
    await pc.setRemoteDescription(data.offer);
    answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.sendAnswer(answer);
    ws.sendIceCandidates(iceCandidatesGenerated);
}

export async function handleAnswer(data) {
    ws.sendIceCandidates(iceCandidatesGenerated);
    await pc.setRemoteDescription(data.answer);
    for (const candidate of iceCandidatesReceivedBuffer) {
        await pc.addIceCandidate(candidate);
    }; 
    iceCandidatesReceivedBuffer.splice(0, iceCandidatesReceivedBuffer.length);
}
export function handleIceCandidates(data) {
    if(pc.remoteDescription) {
        try {
            data.candidatesArray.forEach(candidate => {
                pc.addIceCandidate(candidate);
            });
        } 
        catch (error) {
            console.log("Error trying to add an ice candidate to the pc object", error);
        }
    } else {
        data.candidatesArray.forEach(candidate => {
            iceCandidatesReceivedBuffer.push(candidate);
        })
    }   
}
export function sendMessageUsingDataChannel(message) {
    dataChannel.send(message);
}
export function closePeerConnection() {
    if(pc) {
        pc.close();
        pc = null;
        dataChannel = null;
        console.log("You have closed your peer connection by calling the 'close()' method");
    }
}
