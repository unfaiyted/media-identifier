import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

export const cutAudioToFiveMinutes = (inputFilePath, outputFilePath) => {
    return new Promise((resolve, reject) => {
        console.log('Cutting audio to the first 5 minutes...');
        ffmpeg(inputFilePath)
            .outputOptions('-ss 00:02:00') // Start at the beginning
            .outputOptions('-t 00:08:00') // Cut 5 minutes
            .output(outputFilePath)
            .on('end', () => {
                console.log('Audio cutting complete.');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error during audio cutting:', err.message);
                reject(err);
            })
            .run();
    });
};

export const extractAudio = (inputFilePath, outputFilePath) => {

    // return if output file already exists
    if (fs.existsSync(outputFilePath)) {
        console.log('Audio already extracted. Skipping extraction.');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        console.log('Extracting audio...');
        ffmpeg(inputFilePath)
            .outputOptions('-vn') // Extract audio only
            .output(outputFilePath)
            .on('end', () => {
                console.log('Audio extraction complete.');
                resolve(true);
            })
            .on('error', (err) => {
                console.error('Error during audio extraction:', err.message);
                resolve(null);
            })
            .run();
    });
};

export const getMediaFileDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        // Create a new ffmpeg instance
        const ffprobe = ffmpeg.ffprobe;
        try {


        // Get the media file's duration using ffprobe
        ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error('Error getting media file duration: Defaults to zero. Media may be corrupt.', err.message);
                resolve(0);
            } else {
                const durationInSeconds = metadata.format.duration;
                resolve(durationInSeconds);
            }
        });
        } catch (error) {
            console.log(error);
            resolve(0);
        }
    });
};
