// server.js
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nodewhisper } from 'nodejs-whisper';
import cors from 'cors';
import main from './main.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3013;

// Enable CORS for all routes
app.use(cors());

const uploadsDir = path.join(path.resolve(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// Function to remove timestamps from the transcription text
function cleanTranscriptionText(transcription) {
  // Regular expression to remove timestamps like [00:00:00.000 --> 00:00:02.000]
  return transcription.replace(
    /\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]/g,
    ''
  ).trim();
}

// Route to handle audio file upload and transcription
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  const webmFilePath = req.file.path;

  console.log(`webm file: ${webmFilePath}`);

  try
  {
    // Use nodewhisper for transcription
    const transcription = await nodewhisper(webmFilePath, {
      modelName: 'base.en',
    });

    console.log('Transcription complete:', transcription);

    // Clean the transcription text by removing timestamps
    const cleanedTranscription = cleanTranscriptionText(transcription);

    // Call the main function directly
    const frontend_assistance_response = await main(1, cleanedTranscription);

    res.json({ transcription: frontend_assistance_response });

    // Clean up after transcription
    deleteFile(webmFilePath);
    const wavPath = webmFilePath.replace('.webm', '.wav');
    deleteFile(wavPath);
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    res.status(500).send('Error processing audio file.');
  }
});

// Delete files safely
function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
      } else {
        console.log(`Deleted file: ${filePath}`);
      }
    });
  } else {
    console.log(`File not found, no need to delete: ${filePath}`);
  }
}

// Function to clean up if there are too many files (optional)
function cleanupIfTooManyFiles() {
  const files = fs.readdirSync(uploadsDir);
  if (files.length > 10) {
    console.log('Too many files in uploads folder, cleaning up...');
    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      deleteFile(filePath);
    });
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
