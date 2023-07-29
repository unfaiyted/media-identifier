import sqlite3 from 'sqlite3';

const databasePath = './movies_db.sqlite'; // Replace this with the database file path

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(databasePath, (err) => {
            if (err) {
                reject(new Error(`Error opening the database: ${err.message}`));
            } else {
                db.run(
                    `CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            expected_runtime INTEGER,
            actual_runtime INTEGER,
            tmdb_id INTEGER,
            status_cd TEXT NOT NULL,
            checked BOOLEAN NOT NULL DEFAULT 0,
            extracted_text TEXT,
            openai_response TEXT
          )`,
                    (err) => {
                        if (err) {
                            reject(new Error(`Error creating the table: ${err.message}`));
                        } else {
                            resolve(db);
                        }
                    }
                );
            }
        });
    });
};




const insertMovieRecord = (db, title, year, duration, expectedRuntime, actualRuntime, tmdbId, statusCd) => {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO movies (title, year, duration, expected_runtime, actual_runtime, tmdb_id, status_cd) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, year, duration, expectedRuntime, actualRuntime, tmdbId, statusCd],
            function (err) {
                if (err) {
                    reject(new Error(`Error inserting movie record: ${err.message}`));
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
};


const updateMovieCheckedStatus = async (db, title, year, statusCd) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE movies SET checked = 1, status_cd = ? WHERE title = ? AND year = ?', [statusCd, title, year], function (err) {
            if (err) {
                reject(new Error(`Error updating movie checked status: ${err.message}`));
            } else {
                resolve();
            }
        });
    });
};

export const updateExtractedText = async (db, title, year, extractedText) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE movies SET extracted_text = ? WHERE title = ? AND year = ?', [extractedText, title, year], function (err) {
            if (err) {
                reject(new Error(`Error updating extracted text: ${err.message}`));
            } else {
                resolve();
            }
        });
    });
}

export const updateOpenAIResponse = async (db, title, year, openaiResponse) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE movies SET openai_response = ? WHERE title = ? AND year = ?', [openaiResponse, title, year], function (err) {
            if (err) {
                reject(new Error(`Error updating openai response: ${err.message}`));
            } else {
                resolve();
            }
        });
    });
}

const isMovieChecked = (db, title, year) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM movies WHERE title = ? AND year = ?', [title, year], (err, row) => {
            if (err) {
                reject(new Error(`Error checking movie in the database: ${err.message}`));
            } else {
                resolve(!!row);
            }
        });
    });
};

const getExtractedText = (db, movieName, movieYear) => {
    console.log('Checking if movie is extracted text already...');
    return new Promise((resolve, reject) => {
        db.get('SELECT extracted_text FROM movies WHERE title = ? AND year = ?', [movieName, movieYear], (err, row) => {
            if (err) {
                reject(new Error(`Error fetching extracted_text from the database: ${err.message}`));
            } else {
                resolve(row && row.extracted_text);
            }
        });
    });
};

const getInvalidMoviesSortedByRuntimeDifference = (db) => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM movies WHERE status_cd = "INVALID" ORDER BY ABS(actual_runtime - expected_runtime) DESC',
            (err, rows) => {
                if (err) {
                    reject(new Error(`Error getting invalid movies: ${err.message}`));
                } else {
                    resolve(rows);
                }
            }
        );
    });
};

export { getExtractedText, initializeDatabase, insertMovieRecord, updateMovieCheckedStatus, isMovieChecked, getInvalidMoviesSortedByRuntimeDifference };
