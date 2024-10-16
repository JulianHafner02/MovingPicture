const videoElement = document.getElementById(
    "videoElement"
) as HTMLVideoElement;
const toggleStreamButton = document.getElementById(
    "toggleStream"
) as HTMLButtonElement;
const takePictureButton = document.getElementById(
    "takePicture"
) as HTMLButtonElement;
const grayscalePictureButton = document.getElementById(
    "grayscalePicture"
) as HTMLButtonElement;

let stream: MediaStream | null = null;
async function getMedia(): Promise<void> {
    try {
        // Anforderung der Video- und Audio-Zugriffsberechtigungen
        const constraints: MediaStreamConstraints = { video: true, audio: false }; // Zugriff auf die Benutzermedien anfordern
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        // Setzt das Quellobjekt des Videoelements auf den Stream
        videoElement.srcObject = stream;
    } catch (error) {
        console.error("Error accessing the media devices:", error);
    }
}
function stopMediaTracks(stream: MediaStream): void {
    // Stoppt alle Medien-Tracks des Streams
    stream.getTracks().forEach((track) => track.stop());
}
// Event Listener für den Button
toggleStreamButton.addEventListener("click", () => {
    if (!stream) {
        getMedia(); // Startet den Stream, wenn er nicht aktiv ist
    } else {
        stopMediaTracks(stream); // Stoppt den Stream, wenn er bereits läuft
        stream = null;
        videoElement.srcObject = null;
    }
});

takePictureButton.addEventListener("click", () => {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl: string = canvas.toDataURL("image/png");
        const img: HTMLImageElement = document.createElement("img");
        img.src = dataUrl;
        document.body.appendChild(img);
    }
});

grayscalePictureButton.addEventListener("click", () => {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData: ImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data: Uint8ClampedArray = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg: number = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
        const dataUrl: string = canvas.toDataURL("image/png");
        const img: HTMLImageElement = document.createElement("img");
        img.src = dataUrl;
        document.body.appendChild(img);
    }
});

