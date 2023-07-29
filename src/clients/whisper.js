import FormData from "form-data";
import fs from "fs";
import fetch from "isomorphic-fetch";

export const sendDataToDetectApi = async (audioFilePath) => {
    try {
        console.log('Sending the audio file to the API...');
        const formData = new FormData();

        // Read the audio file as a stream
        const audioStream = fs.createReadStream(audioFilePath);

        // Append the audio stream to the FormData
        formData.append('audio_file', audioStream, 'audio.mp3'); // Set the filename for the stream

        const response = await fetch('http://localhost:9000/detect-language', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Received response from server:', data);
            return data;
            // Do something with the response data (language detection result)
        } else {
            console.error('Error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error during API call:', error.message);
    }
}
export const sendToWhisperApi = async (audioFilePath, language_code="en") => {
    try {
        console.log('Sending the audio file to the Whisper API...');
        const formData = new FormData();

        // Read the audio file as a stream
        const audioStream = fs.createReadStream(audioFilePath);
        const audioBlobFromStream = await new Promise((resolve, reject) => {
            const chunks = [];
            audioStream.on('data', (chunk) => chunks.push(chunk));
            audioStream.on('error', reject);
            audioStream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Append the audio stream to the FormData
        formData.append('audio_file', audioBlobFromStream, 'audio.mp3'); // Set the filename for the stream
        formData.append('language', language_code); // Set the language
        formData.append('output', 'json'); // Set the language
        const response = await fetch('http://localhost:9000/asr', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.text();
            // console.log('Received response from server:', data);
            return data;
            // Do something with the response data (transcript)
        } else {
            console.error('Error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error during API call:', error.message);
    }
};
