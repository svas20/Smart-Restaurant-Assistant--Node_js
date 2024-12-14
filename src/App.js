import React, { useState, useRef } from "react";
import './App.css';

const TransComp = () => {
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState('');
  const [activeButton, setActiveButton] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordedBlobsRef = useRef([]); // Using useRef

  const startRecording = () => {
    
    setActiveButton('start');
    recordedBlobsRef.current = []; // Reset for new recording

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedBlobsRef.current.push(event.data); // Update synchronously
          }
        };

        mediaRecorder.onstop = () => {
          console.log('Recording stopped.');
          setStatus('Recording stopped');
          sendAudioToServer(); // Send data after recording stops
        };

        mediaRecorder.start();
        setStatus('Listening');

        // Stop recording after 10 seconds
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
          }
        }, 6000);
      })
      .catch((err) => {
        console.error('Error accessing microphone:', err);
        setStatus('Error accessing microphone');
      });
  };

  const sendAudioToServer = async () => {
    const audioBlob = new Blob(recordedBlobsRef.current, { type: "audio/webm" });
    console.log('Recorded Blobs Length:', recordedBlobsRef.current.length);
    console.log('Audio Blob size:', audioBlob.size);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      setStatus('Sending audio for transcription...');

      const response = await fetch('http://localhost:3013/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setStatus('Transcription received successfully.');
      setTranscription(result.transcription);
      if(!result.transcription.includes("Thank")){
        console.log("Recording again")
        startRecording();
      }
      recordedBlobsRef.current = []; // Clear after sending
    } catch (error) {
      console.error('Error during transcription:', error);
      setStatus('Transcription failed.');
    }
  };

  return (
    <div className="container">
      <button
        className={`button ${activeButton === 'start' ? 'active' : ''}`}
        onClick={startRecording}
      >
        Start Recording
      </button>

      {status && <p>{status}</p>}

      {transcription && (
        <div className="transcription">
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default TransComp;
