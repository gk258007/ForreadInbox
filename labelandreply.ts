import axios from 'axios';


async function sentToOpenAi(inputString: string): Promise<string> {
  try {
    const openaiApiKey =  process.env.OPENAI; 
    const apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';

    const response = await axios.post(apiUrl, {
      prompt: inputString,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to generate reply for input string');
  }
}

export default sentToOpenAi;