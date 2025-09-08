import { GoogleGenAI, Type } from "@google/genai";
import { Result, PathHistoryItem, BranchingQuestion, RefinementQuestion } from '../types';

// --- SHARED CONFIG & SCHEMAS ---
const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A two-sentence, evocative summary of the game world scenario that was created.",
    },
    scenarioJson: {
      type: Type.STRING,
      description: "A string containing a nested JSON object for a game world scenario. This JSON should contain information on ciety, economy, aesthetics, atmosphere, tone, technology, geography, Non-mundane abilities or powers used by individuals, major conflicts, any other sections that make sense in the context, and key_locations (an array of at least 3 interesting and named places), incorporating details from the user's journey. If any information is missing from the original prompt, creatively make something up. The JSON should be well-structured and abbreviated where necessary for LLM use.",
    },
  },
  required: ['summary', 'scenarioJson'],
};

const branchingChoicesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            questionTemplate: { type: Type.STRING, description: "The original question template provided." },
            options: {
                type: Type.ARRAY,
                description: "An array of exactly 8 antithetical (opposing) choice pairs.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        positive: { type: Type.STRING, description: "The first concept in a pair (e.g., 'Ancient Magic')." },
                        negative: { type: Type.STRING, description: "The opposing concept (e.g., 'Cold Logic')." }
                    },
                    required: ["positive", "negative"]
                }
            }
        },
        required: ['questionTemplate', 'options']
    }
};

const refinementChoicesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            questionTemplate: { type: Type.STRING, description: "A creative follow-up question for the user." },
            options: {
                type: Type.ARRAY,
                description: "An array of exactly 4 distinct and concise string options for the user to choose from.",
                items: { type: Type.STRING }
            }
        },
        required: ['questionTemplate', 'options']
    }
};

const FIXED_QUESTIONS = [
    "What is the overall atmosphere that characterizes this world?",
    "What is the general tone or feel of this world?",
    "What is the theme or level of technology of this world?",
    "What aspect of the geography of this world is unique?",
    "What is an unique or interesting society or social norm of this world?",
    "Who (or what) holds the most power or control in this world?",
    "What is the type of non-mundane power that people hope or grasp for in this world?",
    "What is the central conflict or major threat of this world?"
];

// --- API RATE LIMITER ---
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

const rateLimiter = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    lastRequestTime = Date.now();
};

// --- MISTRAL CONFIG ---
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-large-latest";

// --- STABLE HORDE CONFIG ---
const STABLE_HORDE_API_URL = "https://stablehorde.net/api/v2/generate/text";
const STABLE_HORDE_CLIENT_AGENT = "GameWorldScenarioGenerator/3.4";

// --- OPENAI CONFIG ---
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4-turbo";

// --- DYNAMIC DISPATCHER LOGIC ---
export const getBranchingChoices = async (): Promise<BranchingQuestion[]> => {
    await rateLimiter();
    const mistralApiKey = typeof window !== 'undefined' ? localStorage.getItem('mistral_api_key') : null;
    if (mistralApiKey) {
        return getBranchingChoicesMistral(mistralApiKey);
    }
    const stablehordeApiKey = typeof window !== 'undefined' ? localStorage.getItem('stablehorde_api_key') : null;
    if (stablehordeApiKey) {
        return getBranchingChoicesStableHorde(stablehordeApiKey);
    }
    const openaiApiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
    if (openaiApiKey) {
        return getBranchingChoicesOpenAI(openaiApiKey);
    }
    return getBranchingChoicesGemini();
};

export const getRefinementChoices = async (pathHistory: PathHistoryItem[]): Promise<RefinementQuestion[]> => {
    await rateLimiter();
    const mistralApiKey = typeof window !== 'undefined' ? localStorage.getItem('mistral_api_key') : null;
    if (mistralApiKey) {
        return getRefinementChoicesMistral(pathHistory, mistralApiKey);
    }
    const stablehordeApiKey = typeof window !== 'undefined' ? localStorage.getItem('stablehorde_api_key') : null;
    if (stablehordeApiKey) {
        return getRefinementChoicesStableHorde(pathHistory, stablehordeApiKey);
    }
    const openaiApiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
    if (openaiApiKey) {
        return getRefinementChoicesOpenAI(pathHistory, openaiApiKey);
    }
    return getRefinementChoicesGemini(pathHistory);
};


export const getScenarioJson = async (pathHistory: PathHistoryItem[]): Promise<Result> => {
    await rateLimiter();
    const mistralApiKey = typeof window !== 'undefined' ? localStorage.getItem('mistral_api_key') : null;
    if (mistralApiKey) {
        return getScenarioJsonMistral(pathHistory, mistralApiKey);
    }
    const stablehordeApiKey = typeof window !== 'undefined' ? localStorage.getItem('stablehorde_api_key') : null;
    if (stablehordeApiKey) {
        return getScenarioJsonStableHorde(pathHistory, stablehordeApiKey);
    }
    const openaiApiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
    if (openaiApiKey) {
        return getScenarioJsonOpenAI(pathHistory, openaiApiKey);
    }
    return getScenarioJsonGemini(pathHistory);
};

// --- MISTRAL IMPLEMENTATIONS ---
const getBranchingChoicesMistral = async (apiKey: string): Promise<BranchingQuestion[]> => {
    const questionsString = FIXED_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n');

    const systemPrompt = `You are a creative partner in a game world generator. You MUST respond with a valid JSON object that adheres to this schema: ${JSON.stringify(branchingChoicesSchema)}`;
    const userPrompt = `For each of the following 8 questions about a game world, generate exactly 8 pairs of antithetical (opposing) choices. The choices should be concise and potent (e.g., 'Ancient Magic' vs 'Cold Logic'). Do NOT include adjective openers or conversational phrasing. Return a single JSON array containing 8 objects. Each object must contain the original 'questionTemplate' and an 'options' array of the 8 pairs you generated. Questions:\n${questionsString}`;

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: MISTRAL_MODEL, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }], response_format: { "type": "json_object" } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.message);
        }
        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        return JSON.parse(jsonText) as BranchingQuestion[];
    } catch (error) {
        throw new Error(`Mistral API Error during branching choices: ${error instanceof Error ? error.message : String(error)}`);
    }
};

const getRefinementChoicesMistral = async (pathHistory: PathHistoryItem[], apiKey: string): Promise<RefinementQuestion[]> => {
    const historyString = pathHistory.map(p => `(Q: ${p.question} -> A: ${p.choice})`).join(', ');
    const systemPrompt = `You are a creative partner in a game world generator. You MUST respond with a valid JSON object that adheres to this schema: ${JSON.stringify(refinementChoicesSchema)}`;
    const userPrompt = `Based on the user's path so far: ${historyString}. Review these choices to understand the world being built. Now, generate 2 creative and fun follow-up questions to ask the user. These questions should probe for interesting details that would add unique flavor to the world. For each of the 2 questions, provide exactly 4 distinct, concise options for the user to choose from. Return a JSON array of 2 objects. Each object must contain 'questionTemplate' and an array of 4 string 'options'.`;
    
    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: MISTRAL_MODEL, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }], response_format: { "type": "json_object" } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.message);
        }
        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        return JSON.parse(jsonText) as RefinementQuestion[];
    } catch (error) {
       throw new Error(`Mistral API Error during refinement choices: ${error instanceof Error ? error.message : String(error)}`);
    }
};


const getScenarioJsonMistral = async (pathHistory: PathHistoryItem[], apiKey: string): Promise<Result> => {
    const conversationHistory = pathHistory.map(item => `For the question "${item.question}", my choice was "${item.choice}"`).join('. ');
    const systemPrompt = `You are an expert world-builder. You MUST respond with a valid JSON object that adheres to this schema: ${JSON.stringify(scenarioSchema)}`;
    const userPrompt = `Based on the user's completed 10-step journey: ${conversationHistory}. Your task is to creatively generate a nested JSON object with an idea for a game world scenario. This JSON will be used by an LLM, so it can have abbreviated information but must be well-structured. The JSON object must work in the details of the questions on the journey and additionally include information on: ciety, economy, aesthetics, atmosphere, tone, technology, geography, Non-mundane abilities or powers used by individuals, major conflicts, any other sections that make sense in the context, any other sections that make sense in the context, and key_locations (an array of at least 3 interesting and named places). If any information is missing from the original prompt, creatively invent details that fit the established path. Finally, provide a two-sentence, evocative summary of the world. Return the result in a JSON format matching the provided schema.`;

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: MISTRAL_MODEL, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }], response_format: { "type": "json_object" } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.message);
        }
        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        const parsedResult = JSON.parse(jsonText);
        return { summary: parsedResult.summary || "No summary provided.", scenarioJson: parsedResult.scenarioJson || "{}" };
    } catch (error) {
        throw new Error(`Mistral API Error during scenario generation: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// --- STABLE HORDE IMPLEMENTATIONS ---
const getBranchingChoicesStableHorde = async (apiKey: string): Promise<BranchingQuestion[]> => {
    const questionsString = FIXED_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const prompt = `You are a creative partner in a game world generator. You MUST respond with a single, valid JSON object that adheres to this schema: ${JSON.stringify(branchingChoicesSchema)}. Do not include any other text, explanations, or markdown formatting outside of the JSON object.
    
    Task: For each of the following 8 questions about a game world, generate exactly 8 pairs of antithetical (opposing) choices. The choices should be concise and potent (e.g., 'Ancient Magic' vs 'Cold Logic'). Do NOT include adjective openers or conversational phrasing. Return a single JSON array containing 8 objects. Each object must contain the original 'questionTemplate' and an 'options' array of the 8 pairs you generated.
    
    Questions:\n${questionsString}`;

    try {
        const response = await fetch(STABLE_HORDE_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': apiKey,
                'Client-Agent': STABLE_HORDE_CLIENT_AGENT
            },
            body: JSON.stringify({ prompt, params: { max_context_length: 4096, max_length: 2048, temperature: 0.8 } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status} ${response.statusText}`}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const jsonText = data.generations[0].text.trim();
        const cleanedJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedJson) as BranchingQuestion[];
    } catch (error) {
        throw new Error(`Stable Horde API Error during branching choices: ${error instanceof Error ? error.message : String(error)}`);
    }
};

const getRefinementChoicesStableHorde = async (pathHistory: PathHistoryItem[], apiKey: string): Promise<RefinementQuestion[]> => {
    const historyString = pathHistory.map(p => `(Q: ${p.question} -> A: ${p.choice})`).join(', ');
    const prompt = `You are a creative partner in a game world generator. You MUST respond with a single, valid JSON object that adheres to this schema: ${JSON.stringify(refinementChoicesSchema)}. Do not include any other text, explanations, or markdown formatting outside of the JSON object.

    Task: Based on the user's path so far: ${historyString}. Review these choices to understand the world being built. Now, generate 2 creative and fun follow-up questions to ask the user. These questions should probe for interesting details that would add unique flavor to the world. For each of the 2 questions, provide exactly 4 distinct, concise options for the user to choose from. Return a JSON array of 2 objects. Each object must contain 'questionTemplate' and an array of 4 string 'options'.`;
    
    try {
        const response = await fetch(STABLE_HORDE_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': apiKey,
                'Client-Agent': STABLE_HORDE_CLIENT_AGENT
            },
            body: JSON.stringify({ prompt, params: { max_context_length: 4096, max_length: 1024, temperature: 0.7 } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status} ${response.statusText}`}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const jsonText = data.generations[0].text.trim();
        const cleanedJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedJson) as RefinementQuestion[];
    } catch (error) {
       throw new Error(`Stable Horde API Error during refinement choices: ${error instanceof Error ? error.message : String(error)}`);
    }
};


const getScenarioJsonStableHorde = async (pathHistory: PathHistoryItem[], apiKey: string): Promise<Result> => {
    const conversationHistory = pathHistory.map(item => `For the question "${item.question}", my choice was "${item.choice}"`).join('. ');
    const prompt = `You are an expert world-builder. You MUST respond with a single, valid JSON object that adheres to this schema: ${JSON.stringify(scenarioSchema)}. Do not include any other text, explanations, or markdown formatting outside of the JSON object.

    Task: Based on the user's completed 10-step journey: ${conversationHistory}. Your task is to creatively generate a nested JSON object with an idea for a game world scenario. This JSON will be used by an LLM, so it can have abbreviated information but must be well-structured. The JSON object must work in the details of the questions on the journey and additionally include information on: ciety, economy, aesthetics, atmosphere, tone, technology, geography, Non-mundane abilities or powers used by individuals, major conflicts, any other sections that make sense in the context, any other sections that make sense in the context, and key_locations (an array of at least 3 interesting and named places). If any information is missing from the original prompt, creatively invent details that fit the established path. Finally, provide a two-sentence, evocative summary of the world. Return the result in a JSON format matching the provided schema.`;

    try {
        const response = await fetch(STABLE_HORDE_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': apiKey,
                'Client-Agent': STABLE_HORDE_CLIENT_AGENT
            },
            body: JSON.stringify({ prompt, params: { max_context_length: 4096, max_length: 2048, temperature: 0.8 } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status} ${response.statusText}`}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const jsonText = data.generations[0].text.trim();
        const cleanedJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanedJson);
        return { summary: parsedResult.summary || "No summary provided.", scenarioJson: parsedResult.scenarioJson || "{}" };
    } catch (error) {
        throw new Error(`Stable Horde API Error during scenario generation: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// --- OPENAI IMPLEMENTATIONS ---
const getOpenAIHeaders = (apiKey: string): { [key: string]: string } => {
    const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('openai_organization_id') : null;
    if (orgId) {
        headers['OpenAI-Organization'] = orgId;
    }
    return headers;
}

const getBranchingChoicesOpenAI = async (apiKey: string): Promise<BranchingQuestion[]> => {
    const questionsString = FIXED_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n');

    const systemPrompt = `You are a creative partner in a game world generator. You MUST respond with a valid JSON object that adheres to this schema: ${JSON.stringify(branchingChoicesSchema)}`;
    const userPrompt = `For each of the following 8 questions about a game world, generate exactly 8 pairs of antithetical (opposing) choices. The choices should be concise and potent (e.g., 'Ancient Magic' vs 'Cold Logic'). Do NOT include adjective openers or conversational phrasing. Return a single JSON array containing 8 objects. Each object must contain the original 'questionTemplate' and an 'options' array of the 8 pairs you generated. Questions:\n${questionsString}`;

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: getOpenAIHeaders(apiKey),
            body: JSON.stringify({ model: OPENAI_MODEL, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }], response_format: { "type": "json_object" } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        return JSON.parse(jsonText) as BranchingQuestion[];
    } catch (error) {
        throw new Error(`OpenAI API Error during branching choices: ${error instanceof Error ? error.message : String(error)}`);
    }
};

const getRefinementChoicesOpenAI = async (pathHistory: PathHistoryItem[], apiKey: string): Promise<RefinementQuestion[]> => {
    const historyString = pathHistory.map(p => `(Q: ${p.question} -> A: ${p.choice})`).join(', ');
    const systemPrompt = `You are a creative partner in a game world generator. You MUST respond with a valid JSON object that adheres to this schema: ${JSON.stringify(refinementChoicesSchema)}`;
    const userPrompt = `Based on the user's path so far: ${historyString}. Review these choices to understand the world being built. Now, generate 2 creative and fun follow-up questions to ask the user. These questions should probe for interesting details that would add unique flavor to the world. For each of the 2 questions, provide exactly 4 distinct, concise options for the user to choose from. Return a JSON array of 2 objects. Each object must contain 'questionTemplate' and an array of 4 string 'options'.`;
    
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: getOpenAIHeaders(apiKey),
            body: JSON.stringify({ model: OPENAI_MODEL, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }], response_format: { "type": "json_object" } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        return JSON.parse(jsonText) as RefinementQuestion[];
    } catch (error) {
       throw new Error(`OpenAI API Error during refinement choices: ${error instanceof Error ? error.message : String(error)}`);
    }
};


const getScenarioJsonOpenAI = async (pathHistory: PathHistoryItem[], apiKey: string): Promise<Result> => {
    const conversationHistory = pathHistory.map(item => `For the question "${item.question}", my choice was "${item.choice}"`).join('. ');
    const systemPrompt = `You are an expert world-builder. You MUST respond with a valid JSON object that adheres to this schema: ${JSON.stringify(scenarioSchema)}`;
    const userPrompt = `Based on the user's completed 10-step journey: ${conversationHistory}. Your task is to creatively generate a nested JSON object with an idea for a game world scenario. This JSON will be used by an LLM, so it can have abbreviated information but must be well-structured. The JSON object must work in the details of the questions on the journey and additionally include information on: ciety, economy, aesthetics, atmosphere, tone, technology, geography, Non-mundane abilities or powers used by individuals, major conflicts, any other sections that make sense in the context, any other sections that make sense in the context, and key_locations (an array of at least 3 interesting and named places). If any information is missing from the original prompt, creatively invent details that fit the established path. Finally, provide a two-sentence, evocative summary of the world. Return the result in a JSON format matching the provided schema.`;

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: getOpenAIHeaders(apiKey),
            body: JSON.stringify({ model: OPENAI_MODEL, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }], response_format: { "type": "json_object" } })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        const parsedResult = JSON.parse(jsonText);
        return { summary: parsedResult.summary || "No summary provided.", scenarioJson: parsedResult.scenarioJson || "{}" };
    } catch (error) {
        throw new Error(`OpenAI API Error during scenario generation: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// --- GEMINI IMPLEMENTATIONS ---
const getGeminiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("Gemini API Error: API_KEY is not set in the environment.");
    return new GoogleGenAI({ apiKey: API_KEY });
}

const getBranchingChoicesGemini = async (): Promise<BranchingQuestion[]> => {
    const ai = getGeminiClient();
    const questionsString = FIXED_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const prompt = `You are a creative partner in a collaborative game world scenario generator. For each of the following 8 questions about a game world, generate exactly 8 pairs of antithetical (opposing) choices. The choices should be concise and potent (e.g., 'Ancient Magic' vs 'Cold Logic'). Do NOT include adjective openers or conversational phrasing. Return a single JSON array containing 8 objects. Each object must contain the original 'questionTemplate' and an 'options' array of the 8 pairs you generated. Questions:\n${questionsString}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: branchingChoicesSchema, temperature: 1.0 },
        });
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as BranchingQuestion[];
        if (!Array.isArray(parsedResult) || parsedResult.length !== 8) throw new Error("AI returned an invalid structure for branching choices.");
        return parsedResult;
    } catch (error: any) {
        throw new Error(`Gemini API Error: ${error.message || String(error)}`);
    }
};

const getRefinementChoicesGemini = async (pathHistory: PathHistoryItem[]): Promise<RefinementQuestion[]> => {
    const ai = getGeminiClient();
    const historyString = pathHistory.map(p => `(Q: ${p.question} -> A: ${p.choice})`).join(', ');
    const prompt = `Based on the user's path so far: ${historyString}. Review these choices to understand the world being built. Now, generate 2 creative and fun follow-up questions to ask the user. These questions should probe for created and unexpected or interesting details that would add unique flavor to the world. For each of the 2 questions, provide exactly 4 distinct, concise options for the user to choose from. Return a JSON array of 2 objects. Each object must contain 'questionTemplate' and an array of 4 string 'options'.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: refinementChoicesSchema, temperature: 0.9 },
        });
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as RefinementQuestion[];
        if (!Array.isArray(parsedResult) || parsedResult.length < 2) throw new Error("AI returned an invalid structure for refinement choices.");
        return parsedResult;
    } catch (error: any) {
        throw new Error(`Gemini API Error: ${error.message || String(error)}`);
    }
}

const getScenarioJsonGemini = async (pathHistory: PathHistoryItem[]): Promise<Result> => {
    const ai = getGeminiClient();
    const conversationHistory = pathHistory.map(item => `For the question "${item.question}", my choice was "${item.choice}"`).join('. ');
    const prompt = `Based on the user's completed 10-step journey: ${conversationHistory}. Your task is to creatively generate a nested JSON object with an idea for a game world scenario. This JSON will be used by an LLM, so it can have abbreviated information but must be well-structured. The JSON object must work in the details of the questions on the journey and additionally include information on: society, economy, aesthetics, atmosphere, tone, technology, geography, Non-mundane abilities or powers used by individuals, major conflicts, any other sections that make sense in the context, and key_locations (an array of at least 3 interesting and named places). If any information is missing from the original prompt, creatively invent details that fit the established path. Finally, provide a two-sentence, evocative summary of the world. Return the result in a JSON format matching the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: scenarioSchema, temperature: 0.8 },
        });
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);
        return { summary: parsedResult.summary || "No summary provided.", scenarioJson: parsedResult.scenarioJson || "{}" };
    } catch (error: any) {
        throw new Error(`Gemini API Error: ${error.message || String(error)}`);
    }
};