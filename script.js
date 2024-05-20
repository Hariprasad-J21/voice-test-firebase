document.getElementById("start").addEventListener("click", startRecording);
document.getElementById("stop").addEventListener("click", stopRecording);

let mediaRecorder;

async function startRecording() {
  document.getElementById("start").disabled = true;
  document.getElementById("stop").disabled = false;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      sendChunk(event.data, false);
    }
  };

  mediaRecorder.start(100); // Send chunks every 1000ms (1 second)
}

function stopRecording() {
  document.getElementById("start").disabled = false;
  document.getElementById("stop").disabled = true;

  mediaRecorder.stop();

  // Send a final request to save the audio file
  sendChunk(new Blob(), true);
}

function sendChunk(chunk, isFinal) {
  const reader = new FileReader();
  reader.onloadend = () => {
    fetch(`http://localhost:3000/upload?final=${isFinal}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: reader.result,
    });
  };
  reader.readAsArrayBuffer(chunk);
}
