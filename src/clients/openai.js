import { Configuration, OpenAIApi } from 'openai';

// Replace "YOUR_OPENAI_API_KEY" with your actual OpenAI API key
const OPENAI_API_KEY = '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';

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const sendTextToOpenAI = async (movie, year, text) => {
    try {
        const chatCompletion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            temperature: 0,
            messages: [
                { role: 'user', content: `It's possible that movie is ${movie} from ${year}. But that could be wrong. I want you to help validate.` },
                { role: 'assistant', content: "I identify movies.js. I will attempt a guess if I'm not sure. Response format Example: { movie: 'Movie Name', year: '1999'}"},
                { role: 'user', content: "Respond TRUE if you think it is the movie. Based on the text that was generated from a movie's audio: " +text.slice(0,3000) },
                { role: 'user', content: 'Respond with TRUE if the movie is likely the movie I referenced.' }
            ]
        });

        return chatCompletion.data.choices[0].message;
    } catch (error) {
        throw new Error('Error during OpenAI API call:', error.message);
    }
};
