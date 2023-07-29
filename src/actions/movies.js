import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import {extractAudio, getMediaFileDuration} from "../utils/media.js";
import {getExpectedMediaDetailsFromTMDB} from "../clients/tmdb.js";
import {
    getInvalidMoviesSortedByRuntimeDifference,
    initializeDatabase,
    insertMovieRecord,
    isMovieChecked, getExtractedText, updateExtractedText,
    updateMovieCheckedStatus, updateOpenAIResponse
} from "../utils/db.js";
import {sendTextToOpenAI} from "../clients/openai.js";
import {sendToWhisperApi} from "../clients/whisper.js";

export const analyzeMovies = async (rootFolderPath, outputFilePath) => {
    try {
        const db = await initializeDatabase();
        const subfolders = await fs.promises.readdir(rootFolderPath);

        for (const subfolder of subfolders) {
            const subfolderPath = path.join(rootFolderPath, subfolder);
            if (fs.lstatSync(subfolderPath).isDirectory()) {
                const movieNameWithYear = subfolder.match(/^(.+) \((\d{4})\)$/);
                if (movieNameWithYear) {
                    const movieName = movieNameWithYear[1];
                    const movieYear = movieNameWithYear[2];
                    const files = await fs.promises.readdir(subfolderPath);
                    const mediaFiles = files.filter((file) => file.match(/\.(mp4|avi|mkv|mp3)$/i));
                    if (mediaFiles.length > 0) {
                        let largestMediaFile = '';
                        let largestMediaDuration = 0;
                        for (const mediaFile of mediaFiles) {
                            const mediaFilePath = path.join(subfolderPath, mediaFile);
                            const mediaDuration = await getMediaFileDuration(mediaFilePath);
                            if (mediaDuration > largestMediaDuration) {
                                largestMediaDuration = mediaDuration;
                                largestMediaFile = mediaFilePath;
                            }
                        }

                        const checked = await isMovieChecked(db, movieName, movieYear);
                        if (!checked) {

                        const mediaDetails = await getExpectedMediaDetailsFromTMDB(movieName, movieYear);
                        const expectedRuntimeInMinutes = mediaDetails?.runtime || 0;

                        if (expectedRuntimeInMinutes) {
                            const runtimeDifferenceInMinutes = Math.abs(largestMediaDuration / 60 - expectedRuntimeInMinutes);
                            const thresholdInMinutes = 5; // 5 minutes threshold in minutes
                            const invalidThresholdInMinutes = 10; // 10 minutes threshold in minutes

                            let statusCd = 'VALID';
                            if (runtimeDifferenceInMinutes > invalidThresholdInMinutes) {
                                statusCd = 'INVALID';
                            } else if (runtimeDifferenceInMinutes > thresholdInMinutes) {
                                statusCd = 'UNK';
                            } else if (largestMediaDuration === 0) {
                                statusCd = 'ERROR';
                            }

                            let analysis = `${movieName} (${movieYear}) - `;
                            analysis += `Expected Runtime: ${expectedRuntimeInMinutes}m, `;
                            analysis += `Actual Runtime: ${largestMediaDuration / 60}m`;
                            analysis += ` (${runtimeDifferenceInMinutes}m difference)`;

                            if (statusCd !== 'VALID') {
                                analysis = `!!!${statusCd} ${analysis}`;
                            }

                            // Check if the movie has been checked before

                                // Append the analysis to the output file
                                await fse.appendFile(outputFilePath, analysis + '\n');

                                // Store the movie record in the database
                                await insertMovieRecord(
                                    db,
                                    movieName,
                                    movieYear,
                                    largestMediaDuration,
                                    expectedRuntimeInMinutes,
                                    largestMediaDuration / 60,
                                    mediaDetails?.id, // Replace null with the actual TMDB ID if available
                                    statusCd
                                );
                                await updateMovieCheckedStatus(db, movieName, movieYear, statusCd);
                            } else {
                                console.log(`Skipping already checked movie: ${movieName} (${movieYear})`);
                            }

                            // Update the checked status in the database
                        }
                    }
                }
            }
        }

        console.log('Analysis completed. Results saved in', outputFilePath);
    } catch (error) {
        console.error('Error:', error.message);
    }
};

export const analyzeInvalidMovies = async (rootFolderPath, audioFileName) => {
    try {
        const db = await initializeDatabase();

        // Fetch and analyze invalid movies sorted by the greatest runtime difference
        const invalidMovies = await getInvalidMoviesSortedByRuntimeDifference(db);

        for (const movie of invalidMovies) {
            console.log(`Analyzing invalid movie: ${movie.title} (${movie.year})`);
            const { title: movieName, year: movieYear } = movie;
            const subfolderPath = path.join(rootFolderPath, `${movieName} (${movieYear})`);
            const files = await fs.promises.readdir(subfolderPath);
            const mediaFiles = files.filter((file) => file.match(/\.(mp4|avi|mkv|mp3)$/i));


            if (mediaFiles.length > 0) {
                let largestMediaFile = '';
                let largestMediaDuration = 0;
                for (const mediaFile of mediaFiles) {
                    const mediaFilePath = path.join(subfolderPath, mediaFile);
                    const mediaDuration = await getMediaFileDuration(mediaFilePath);
                    if (mediaDuration > largestMediaDuration) {
                        largestMediaDuration = mediaDuration;
                        largestMediaFile = mediaFilePath;

                    }

                }

                  if (largestMediaDuration === 0) {
                        await updateExtractedText(db, movieName, movieYear, 'ERROR EXTRACTING AUDIO FROM VIDEO FILE');
                        await updateMovieCheckedStatus(db, movieName, movieYear, 'ERROR')
                        continue;
                    }

                console.log('Media file Chosen:', largestMediaFile);

                audioFileName = `./output/${movieName} (${movieYear}).mp3`

                let extractedText = await getExtractedText(db, movieName, movieYear);

                if(extractedText == null) {
                    const audio = await extractAudio(largestMediaFile, audioFileName);

                    if(audio == null) {
                        console.log('Skipping! Error extracting audio from video file');
                        await updateExtractedText(db, movieName, movieYear, 'ERROR EXTRACTING AUDIO FROM VIDEO FILE');
                        continue;
                    }

                    extractedText = await sendToWhisperApi(audioFileName);

                     // Perform audio extraction and convert to text using OpenAI
                    // Update the database with the extracted text

                    await updateExtractedText(db, movieName, movieYear, extractedText);

                }
                               // Send the extracted text to OpenAI
                const openAiResponse = await sendTextToOpenAI(movieName, movieYear, extractedText);

                // Parse the OpenAI response
                console.log('ai response:', openAiResponse);
                await updateOpenAIResponse(db, movieName, movieYear, openAiResponse.content);

                if (openAiResponse.content.toLowerCase().includes("true") ||
                    (openAiResponse.content.toLowerCase().includes(movieName) && openAiResponse.content.toLowerCase().includes(movieYear))) {

                    await updateMovieCheckedStatus(db, movieName, movieYear, 'VALID-OPENAI');
                    console.log(`OpenAI response matches expected movie name and year for ${movieName} (${movieYear}).`);
                } else {
                    console.log(`OpenAI response does not match expected movie name and year for ${movieName} (${movieYear}).`);
                    await updateMovieCheckedStatus(db, movieName, movieYear, 'INVALID-OPENAI')
                }


            }
        }

        console.log('Analysis of invalid movies completed.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {

        if (db) {
            db.close((err => {
                if (err) {
                    console.error('Error closing the database:', err.message);
                } else {
                    console.log('Database closed.');
                }
            }));
        }
    }
};
