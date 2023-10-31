const localvideo = document.getElementById('localvideo');
const remotevideo = document.getElementById('remotevideo');

let pc1, pc2, localstream;

async function start() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  localvideo.srcObject = stream;
  localstream = stream;
}

async function call() {
  pc1 = new RTCPeerConnection({});
  pc1.addEventListener('icecandidate', (e) => onIceCandidate(pc1, e));
  pc2 = new RTCPeerConnection({});
  pc2.addEventListener('icecandidate', (e) => onIceCandidate(pc2, e));
  pc2.addEventListener('track', gotRemoteStream);
  localstream.getTracks().forEach((track) => {
    pc1.addTrack(track, localstream);
  });
  try {
    const offer = await pc1.createOffer({
      offerToReceiveVideo: 1,
    });
    await onCreateOfferSucces(offer);
  } catch (error) {
    console.log(error);
  }
}

async function onCreateOfferSucces(offer) {
  try {
    await pc1.setLocalDescription(offer);
  } catch (error) {
    console.log(error);
  }
  try {
    await pc2.setRemoteDescription(offer);
  } catch (error) {
    console.log(error);
  }
  try {
    const answer = await pc2.createAnswer();
    await onCreateAnswerSuccess(answer);
  } catch (error) {
    console.log(error);
  }
}

function gotRemoteStream(e) {
  if (remotevideo.srcObject !== e.streams[0]) {
    remotevideo.srcObject = e.streams[0];
  }
}

async function onCreateAnswerSuccess(answer) {
  try {
    await pc1.setRemoteDescription(answer);
    sendMessage(answer);
  } catch (error) {
    console.log(error);
  }
  try {
    await pc2.setLocalDescription(answer);
    sendMessage(answer);
  } catch (error) {
    console.log(error);
  }
}

async function onIceCandidate(pc, e) {
  try {
    await getOtherPc(pc).addIceCandidate(e.candidate);
    if (e.candidate) {
      sendMessage({
        type: 'candidate',
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

function getOtherPc(pc) {
  return pc === pc1 ? pc2 : pc1;
}

function stop() {
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
}

var socket = io.connect('', { port: 5000 });

function sendMessage(message) {
  socket.emit('message', message);
}

socket.on('message', function (message) {
  if (message.type === 'offer') {
    pc.setRemoteDescription(new RTCSessionDescription(message));
    createAnswer();
  } else if (message.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate,
    });
    pc.addIceCandidate(candidate);
  }
});
