"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const videoElement = document.getElementById("videoElement");
const toggleStreamButton = document.getElementById("toggleStream");
const takePictureButton = document.getElementById("takePicture");
const grayscalePictureButton = document.getElementById("grayscalePicture");
let stream = null;
function getMedia() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Anforderung der Video- und Audio-Zugriffsberechtigungen
            const constraints = { video: true, audio: false }; // Zugriff auf die Benutzermedien anfordern
            stream = yield navigator.mediaDevices.getUserMedia(constraints);
            // Setzt das Quellobjekt des Videoelements auf den Stream
            videoElement.srcObject = stream;
        }
        catch (error) {
            console.error("Error accessing the media devices:", error);
        }
    });
}
function stopMediaTracks(stream) {
    // Stoppt alle Medien-Tracks des Streams
    stream.getTracks().forEach((track) => track.stop());
}
// Event Listener für den Button
toggleStreamButton.addEventListener("click", () => {
    if (!stream) {
        getMedia(); // Startet den Stream, wenn er nicht aktiv ist
    }
    else {
        stopMediaTracks(stream); // Stoppt den Stream, wenn er bereits läuft
        stream = null;
        videoElement.srcObject = null;
    }
});
takePictureButton.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = dataUrl;
        document.body.appendChild(img);
    }
});
grayscalePictureButton.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = dataUrl;
        document.body.appendChild(img);
    }
});
