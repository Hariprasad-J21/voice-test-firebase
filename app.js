const express = require("express");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
const app = express();
const port = 3000;
const os = require("os");
const cors = require("cors");

app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = require("./store-voice-firebase-adminsdk-4ps9i-e8b81e8a47.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "reportbutton-bdc25.appspot.com",
});

const bucket = admin.storage().bucket();

let audioChunks = [];

app.post("/upload", (req, res) => {
  const isFinalChunk = req.query.final === "true";
  let chunk = [];

  req.on("data", (data) => {
    chunk.push(data);
  });

  req.on("end", async () => {
    audioChunks.push(Buffer.concat(chunk));
    if (isFinalChunk) {
      const fileName = `audio-${Date.now()}.bin`; // Change the extension to .bin for pure binary format
      const audioBuffer = Buffer.concat(audioChunks);

      // Create a temporary file
      const tempFilePath = path.join(os.tmpdir(), fileName);
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Upload to Firebase Storage
      try {
        await bucket.upload(tempFilePath, {
          destination: fileName,
          contentType: "application/octet-stream", // Specify generic binary content type
        });

        // Remove the temporary file
        fs.unlinkSync(tempFilePath);

        audioChunks = []; // Clear the chunks after saving
        res.send("Audio file saved as pure binary successfully");
        console.log("Audio file saved as pure binary successfully");
      } catch (err) {
        console.error("Error saving audio file", err);
        res.status(500).send("Error saving audio file");
      }
    } else {
      res.sendStatus(200);
    }
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
