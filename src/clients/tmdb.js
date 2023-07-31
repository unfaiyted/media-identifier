import fs from 'fs';
import fetch from 'isomorphic-fetch';


export const getExpectedMediaDetailsFromTMDB = async (movieTitle, year) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    if (!TMDB_API_KEY) {
        throw new Error('TMDB_API_KEY environment variable is not set.');
    }

    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&primary_release_year=${year}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from TMDB API: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('TMDB API response:', data);
        if (data.results.length > 0) {
            // Assuming the first result is the most relevant match

            const movieId = data.results[0].id;

            const movieResults = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);

            const details = await movieResults.json();

            console.log('TMDB API response:', details);


            return details; // Convert minutes to seconds
        } else {
            throw new Error('No matching movie found in TMDB database.');
        }
    } catch (error) {
        console.error('Error fetching data from TMDB:', error.message);
        return null;
    }
};

export const compareRuntimes = async (filePath, movieTitle) => {
    try {
        const actualRuntimeInSeconds = getMediaFileRuntime(filePath);
        const expectedRuntimeInSeconds = await getExpectedMediaRuntimeFromTMDB(movieTitle);

        if (actualRuntimeInSeconds && expectedRuntimeInSeconds) {
            const runtimeDifferenceInSeconds = Math.abs(actualRuntimeInSeconds - expectedRuntimeInSeconds);
            const thresholdInSeconds = 300; // 5 minutes threshold in seconds

            if (runtimeDifferenceInSeconds > thresholdInSeconds) {
                console.log(`Mismatch in runtime for movie "${movieTitle}".`);
                console.log(`Actual Runtime: ${actualRuntimeInSeconds} seconds`);
                console.log(`Expected Runtime: ${expectedRuntimeInSeconds} seconds`);
                console.log('Something might be wrong with this movie.');
            } else {
                console.log(`The runtime for movie "${movieTitle}" is within an acceptable range.`);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

const mediaFilePath = '/path/to/your/media/file.mp4'; // Replace this with the actual file path
const movieTitle = 'Zoolander (2001)'; // Replace this with the movie title

// compareRuntimes(mediaFilePath, movieTitle);
