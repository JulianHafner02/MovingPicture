const videoElement = document.getElementById("videoElement") as HTMLVideoElement;
const toggleStreamButton = document.getElementById("toggleStream") as HTMLButtonElement;


let stream: MediaStream | null = null;
let startClock: Boolean = false;
let currentPicture: number = 0;

async function getMedia(): Promise<void> {
    try {
        const constraints: MediaStreamConstraints = { video: true, audio: false };
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        videoElement.srcObject = stream;
        videoElement.style.transform = "scaleX(-1)";
        videoElement.width = 640;
        videoElement.height = 480;

        let leftOverlay = document.getElementById("leftOverlay");
        if (leftOverlay == null) {
            leftOverlay = document.createElement("div");
            leftOverlay.id = "leftOverlay";
            leftOverlay.style.position = "absolute";
            leftOverlay.style.width = "160px";
            leftOverlay.style.height = "120px";
            leftOverlay.style.top = `${videoElement.offsetTop}px`;
            leftOverlay.style.left = `${videoElement.offsetLeft + videoElement.offsetWidth - 162}px`;
            leftOverlay.style.border = "2px solid red";
            document.body.appendChild(leftOverlay);
        } else {
            leftOverlay.hidden = false;
        }

        let rightOverlay = document.getElementById("rightOverlay");
        if (rightOverlay == null) {
            rightOverlay = document.createElement("div");
            rightOverlay.id = "rightOverlay";
            rightOverlay.style.position = "absolute";
            rightOverlay.style.width = "160px";
            rightOverlay.style.height = "120px";
            rightOverlay.style.top = `${videoElement.offsetTop}px`;
            rightOverlay.style.left = `${videoElement.offsetLeft}px`;
            rightOverlay.style.border = "2px solid red";
            document.body.appendChild(rightOverlay);
        } else {
            rightOverlay.hidden = false;
        }

        setTimeout(createReferenceImage, 1000); // Delay the creation of the reference image
        
    } catch (error) {
        console.error("Error accessing the media devices:", error);
    }
}

function stopMediaTracks(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
}

toggleStreamButton.addEventListener("click", () => {
    if (!stream) {
        getMedia();
    } else {
        stopMediaTracks(stream);
        stream = null;
        videoElement.srcObject = null;
        startClock = false;
        const leftOverlay = document.getElementById("leftOverlay");
        const rightOverlay = document.getElementById("rightOverlay");
        if (leftOverlay != null) {
            leftOverlay.hidden = true;
        }
        if (rightOverlay != null) {
            rightOverlay.hidden = true;
        }
    }
});

function createReferenceImage(): void {
    sessionStorage.removeItem("referenceImage");
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl: string = canvas.toDataURL("image0/png");
        sessionStorage.setItem("referenceImage", dataUrl);
        console.log("Reference Image created");
        startClock = true;
    }
}

function takePicture(): void {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl: string = canvas.toDataURL("image1/png");
        sessionStorage.setItem("captureImage", dataUrl);
        console.log("Captured Image created");
    }
}

function differenceImage(): void {
    const refImg: string | null = sessionStorage.getItem("referenceImage");
    const capImg: string | null = sessionStorage.getItem("captureImage");

    if (refImg != null && capImg != null) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (ctx) {
            canvas.width = 640;
            canvas.height = 480;
            const refImgEl: HTMLImageElement = new Image();
            refImgEl.src = refImg;
            refImgEl.onload = () => {
                ctx.drawImage(refImgEl, 0, 0);
                const imgData1 = ctx.getImageData(0, 0, canvas.width, canvas.height);

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const capImgEl: HTMLImageElement = new Image();
                capImgEl.src = capImg;
                capImgEl.onload = () => {
                    ctx.drawImage(capImgEl, 0, 0);
                    const imgData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const diff = ctx.createImageData(canvas.width, canvas.height);
                    for (let i = 0; i < imgData1.data.length; i += 4) {
                        diff.data[i] = Math.abs(imgData1.data[i] - imgData2.data[i]);
                        diff.data[i + 1] = Math.abs(imgData1.data[i + 1] - imgData2.data[i + 1]);
                        diff.data[i + 2] = Math.abs(imgData1.data[i + 2] - imgData2.data[i + 2]);
                        diff.data[i + 3] = 255;
                    }
                    ctx.putImageData(diff, 0, 0);
                    const diffDataUrl = canvas.toDataURL("image2/png");
                    sessionStorage.setItem("diffImage", diffDataUrl);
                }
            }
        }
        console.log("differenceImage created");
    }
}

function analyseColors(): void {
    const diffImg: string | null = sessionStorage.getItem("diffImage");
    const leftOverlay = document.getElementById("leftOverlay");
    const rightOverlay = document.getElementById("rightOverlay");
    if (diffImg != null) {
        const diffCanvas: HTMLCanvasElement = document.createElement("canvas");
        const diffCtx: CanvasRenderingContext2D | null = diffCanvas.getContext("2d");

        if (diffCtx) {
            diffCanvas.width = 640;
            diffCanvas.height = 480;
            const diffImgEl: HTMLImageElement = new Image();
            diffImgEl.src = diffImg;
            diffImgEl.onload = () => {
                diffCtx.drawImage(diffImgEl, 0, 0, diffCanvas.width, diffCanvas.height);

                const leftCorner: ImageData = diffCtx.getImageData(0, 0, diffCanvas.width / 4, diffCanvas.height / 4);
                let leftCornerSum: number = 0;
                for (let i = 0; i < leftCorner.data.length; i += 4) {
                    leftCornerSum += leftCorner.data[i];
                }
                const leftCornerAvg: number = leftCornerSum / (leftCorner.data.length / 4);
                console.log(leftCornerAvg);
                if (leftCornerAvg > 20) {
                    if (leftOverlay != null) {
                        leftOverlay.style.border = "2px solid green";
                        switchImages("previous");
                    }
                }else{
                    if (leftOverlay != null) {
                        leftOverlay.style.border = "2px solid red";
                    }
                }
                
                const rightCorner: ImageData = diffCtx.getImageData(diffCanvas.width - diffCanvas.width / 4, 0, diffCanvas.width / 4, diffCanvas.height / 4);
                let rightCornerSum: number = 0;
                for (let i = 0; i < rightCorner.data.length; i += 4) {
                    rightCornerSum += rightCorner.data[i];
                }
                const rightCornerAvg: number = rightCornerSum / (rightCorner.data.length / 4);
                console.log(rightCornerAvg);
                if (rightCornerAvg > 20) {
                    if (rightOverlay != null) {
                        rightOverlay.style.border = "2px solid green";
                        switchImages("next");
                    }
                }else{
                    if (rightOverlay != null) {
                        rightOverlay.style.border = "2px solid red";
                    }
                }
            }
        }
    }
}

function deletePictures(): void {
    sessionStorage.removeItem("captureImage");
    sessionStorage.removeItem("grayscaleImage");
    sessionStorage.removeItem("diffImage");
    console.log("Pictures Deleted");
}


function switchImages(order: string): void {

    const picture = document.getElementById("picture") as HTMLImageElement;
    const allPictureSources = ["../pictures/Picture1.jpg", "../pictures/Picture2.jpg", "../pictures/Picture3.jpg", "../pictures/Picture4.jpg", "../pictures/Picture5.jpg"];
    if (order == "previous") {
        
        currentPicture--;
        if (currentPicture < 0) {
            currentPicture = allPictureSources.length - 1;
        }
        picture.src = allPictureSources[currentPicture];
    } else if (order == "next") {
        currentPicture++;
        if (currentPicture >= allPictureSources.length) {
            currentPicture = 0;
        }
        picture.src = allPictureSources[currentPicture];
    
    }

}

setInterval(() => {
    if (startClock) {

        takePicture();
        differenceImage();
        analyseColors();
        deletePictures();
    }
}, 500);



