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
let stream = null;
let startClock = false;
let currentPicture = 0;
let rightCount = 0;
let leftCount = 0;
function getMedia() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const constraints = { video: true, audio: false };
            stream = yield navigator.mediaDevices.getUserMedia(constraints);
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
            }
            else {
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
            }
            else {
                rightOverlay.hidden = false;
            }
            setTimeout(createReferenceImage, 1000); // Delay the creation of the reference image
        }
        catch (error) {
            console.error("Error accessing the media devices:", error);
        }
    });
}
function stopMediaTracks(stream) {
    stream.getTracks().forEach((track) => track.stop());
}
toggleStreamButton.addEventListener("click", () => {
    if (!stream) {
        getMedia();
    }
    else {
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
function createReferenceImage() {
    sessionStorage.removeItem("referenceImage");
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image0/png");
        sessionStorage.setItem("referenceImage", dataUrl);
        console.log("Reference Image created");
        startClock = true;
    }
}
function takePicture() {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image1/png");
        sessionStorage.setItem("captureImage", dataUrl);
        console.log("Captured Image created");
    }
}
function differenceImage() {
    const refImg = sessionStorage.getItem("referenceImage");
    const capImg = sessionStorage.getItem("captureImage");
    if (refImg != null && capImg != null) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
            canvas.width = 640;
            canvas.height = 480;
            const refImgEl = new Image();
            refImgEl.src = refImg;
            refImgEl.onload = () => {
                ctx.drawImage(refImgEl, 0, 0);
                const imgData1 = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const capImgEl = new Image();
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
                };
            };
        }
        console.log("differenceImage created");
    }
}
function analyseColors() {
    const diffImg = sessionStorage.getItem("diffImage");
    const leftOverlay = document.getElementById("leftOverlay");
    const rightOverlay = document.getElementById("rightOverlay");
    if (diffImg != null) {
        const diffCanvas = document.createElement("canvas");
        const diffCtx = diffCanvas.getContext("2d");
        if (diffCtx) {
            diffCanvas.width = 640;
            diffCanvas.height = 480;
            const diffImgEl = new Image();
            diffImgEl.src = diffImg;
            diffImgEl.onload = () => {
                diffCtx.drawImage(diffImgEl, 0, 0, diffCanvas.width, diffCanvas.height);
                const leftCorner = diffCtx.getImageData(0, 0, diffCanvas.width / 4, diffCanvas.height / 4);
                let leftCornerSum = 0;
                for (let i = 0; i < leftCorner.data.length; i += 4) {
                    leftCornerSum += leftCorner.data[i];
                }
                const leftCornerAvg = leftCornerSum / (leftCorner.data.length / 4);
                console.log(leftCornerAvg);
                if (leftCornerAvg > 20) {
                    if (leftOverlay != null) {
                        leftOverlay.style.border = "2px solid green";
                        switchImages("next");
                        leftCount += 1;
                        console.log("leftcount: " + leftCount);
                        if (leftCount > 10) {
                            setTimeout(() => {
                                switchImages("next");
                            }, 250);
                        }
                    }
                }
                else {
                    if (leftOverlay != null) {
                        leftOverlay.style.border = "2px solid red";
                        leftCount = 0;
                    }
                }
                const rightCorner = diffCtx.getImageData(diffCanvas.width - diffCanvas.width / 4, 0, diffCanvas.width / 4, diffCanvas.height / 4);
                let rightCornerSum = 0;
                for (let i = 0; i < rightCorner.data.length; i += 4) {
                    rightCornerSum += rightCorner.data[i];
                }
                const rightCornerAvg = rightCornerSum / (rightCorner.data.length / 4);
                console.log(rightCornerAvg);
                if (rightCornerAvg > 20) {
                    if (rightOverlay != null) {
                        rightOverlay.style.border = "2px solid green";
                        switchImages("previous");
                        rightCount += 1;
                        console.log("rightcount: " + rightCount);
                        if (rightCount > 10) {
                            setTimeout(() => {
                                switchImages("previous");
                            }, 250);
                        }
                    }
                }
                else {
                    if (rightOverlay != null) {
                        rightOverlay.style.border = "2px solid red";
                        rightCount = 0;
                    }
                }
            };
        }
    }
}
function deletePictures() {
    sessionStorage.removeItem("captureImage");
    sessionStorage.removeItem("grayscaleImage");
    sessionStorage.removeItem("diffImage");
    console.log("Pictures Deleted");
}
function switchImages(order) {
    const picture = document.getElementById("picture");
    const allPictureSources = ["../pictures/Picture1.jpg", "../pictures/Picture2.jpg", "../pictures/Picture3.jpg", "../pictures/Picture4.jpg", "../pictures/Picture5.jpg",
        "../pictures/Picture6.jpg", "../pictures/Picture7.jpg", "../pictures/Picture8.jpg", "../pictures/Picture9.jpg", "../pictures/Picture10.jpg"];
    if (order == "previous") {
        currentPicture--;
        if (currentPicture < 0) {
            currentPicture = allPictureSources.length - 1;
        }
        picture.src = allPictureSources[currentPicture];
    }
    else if (order == "next") {
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
