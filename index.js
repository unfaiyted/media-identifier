import fs from 'fs';
import fetch from 'isomorphic-fetch';
import FormData from 'form-data';
import path from 'path';
import {sendTextToOpenAI} from "./src/clients/openai.js";
import {getMediaFileDuration} from "./src/utils/media.js";
import {analyzeInvalidMovies, analyzeMovies} from "./src/actions/movies.js";
import {getInvalidMoviesSortedByRuntimeDifference, initializeDatabase} from "./src/utils/db.js";
import dotenv from 'dotenv';
dotenv.config(); // This loads the environment variables from the .env file

const inputFilePath = '/media/raid/movies.js/Zoolander (2001)/Zoolander (2001).mp4'; // Replace with the actual path to your movie file
const outputFilePath = './audio.mp3'; // Replace with the desired output path and filename
const cutOutputFilePath = './audio-cut.mp3'; // Replace with the desired output path for the 5-minute cut audio




(async () => {
    try {
        // Start the audio extraction process
        await initializeDatabase();
       /* const runtime = await getMediaFileDuration(inputFilePath) / 60;

        const expected = await getExpectedMediaRuntimeFromTMDB('Zoolander', 2001);

        console.log(runtime, expected);*/


        await analyzeMovies('/media/raid/movies', './output.txt');

       await analyzeInvalidMovies('/media/raid/movies', './audio.mp3');

         // console.log(lang);

        // Send the extracted audio file to the API
        // let fullText = await sendToAPI(outputFilePath /*lang.language_code*/)

        // let fullText = 'Test save'
        // save text to file
        //fs.writeFileSync(path.join('text.txt'), fullText);

        // get text from file
        //const text = fs.readFileSync(path.join('text.txt'), 'utf8');


        //const result =await sendTextToOpenAI(text);

        //console.log(result);

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
