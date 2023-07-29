# Movie Identifier

This is a node application that will identify movies in a folder. Currently, it assumed all movies follow a specific convention for naming. 
It will look to identify the movie based on filename, it validates the movie based on runtime initially.
IT has a second pass validation checking if the contents of the movie text file match the movie name.

ChatGPT makes a prediction based on the movie transcript and the movie name.

It calculated ans sends the movie transcriptcontents to the ChatGPT

## Installation

This project relies on [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/).

It used the whisper language model to determine the text of the movie. 
It then checks the movie transcript to see if it matches what the movie is about.

```bash
npm install
```

## Usage

```bash
npm run start
```


## Table of Contents

## Description
