import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the AI Core. Ensure your API key is correctly routed from your .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

// --- BASE AGENT CALLER ---
async function callAgent(prompt: string, role: string) {
  // Using gemini-1.5-flash for the fastest response times during UI interactions
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// --- 1. THE MASTER ARCHITECT (AWAKENING PROTOCOL) ---
export async function forgePlayerBlueprint(answers: string[]) {
  const prompt = `
    You are the Master Architect. The player has answered these psychological awakening questions:
    1. ${answers[0]}
    2. ${answers[1]}
    3. ${answers[2]}

    Analyze their personality, friction points, and goals. Generate a complete RPG profile for them.
    Return ONLY a valid JSON object matching this exact schema. Do not include markdown blocks.
    SCHEMA:
    {
      "player_class": "String (e.g., THE CHRONO-ARCHITECT, THE SHADOWBLADE)",
      "starting_stats": {
        "strength": Number (1-10),
        "wisdom": Number (1-10),
        "discipline": Number (1-10),
        "focus": Number (1-10)
      },
      "empathy_insight": {
        "title": "String (A cool name for their psychological profile)",
        "body": "String (A 2-3 sentence deep analysis of their friction and potential)"
      },
      "daily_dungeons": [
        {
          "title": "String (An actionable daily habit/quest)",
          "difficulty": "String (E-Rank to S-Rank)",
          "xp_reward": Number (10 to 100)
        }
      ]
    }
  `;

  try {
    console.log("[System] Waking The Master Architect...");
    const rawJson = await callAgent(prompt, "Master Architect");
    const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.warn("[System Override] Architect Error. Injecting Fallback Blueprint.");
    return {
      player_class: "THE DRIFTER",
      starting_stats: { strength: 1, wisdom: 1, discipline: 1, focus: 1 },
      empathy_insight: { title: "System Reboot", body: "Data corrupted. Default template loaded." },
      daily_dungeons: []
    };
  }
}

// --- 2. THE INTERROGATOR & TASKMASTER (DIRECTIVES) ---
export async function forgeNewDirective(userGoal: string, userAnswers: string = "") {
  const contextBlock = userAnswers 
    ? `The user has provided this clarifying context: "${userAnswers}"` 
    : "Evaluate if this goal is too broad.";

  const prompt = `
    You are the System Architect. The player submitted a directive: "${userGoal}".
    ${contextBlock}

    STEP 1: EVALUATION
    If the goal is broad (e.g., "Learn Python", "Get fit", "Fix resume") AND there is no clarifying context provided yet, you MUST intercept it.
    If intercepted, return requires_clarification: true, and write a punchy, 2-3 question message asking for specifics (e.g., current skill level, time available, specific end-goal).

    STEP 2: FORGE CAMPAIGN
    If the goal is highly specific, OR if the user has provided sufficient clarifying context, fracture the goal into 5 to 10 actionable micro-quests.
    You MUST rank them using ONLY these specific tiers based on effort/time:
    - E-Rank (Easy, <15 mins) | +15 XP
    - C-Rank (Normal, 30 mins) | +30 XP
    - B-Rank (Hard, 45 mins) | +50 XP
    - A-Rank (Elite, 60 mins) | +75 XP
    - S-Rank (Boss, 90+ mins) | +100 XP
    
    You MUST return ONLY a valid JSON object matching this exact schema. Do not include markdown formatting.
    SCHEMA:
    {
      "requires_clarification": Boolean,
      "clarification_message": "String",
      "dungeons": [
        {
          "title": "String",
          "difficulty": "String",
          "xp_reward": Number
        }
      ]
    }
  `;

  try {
    console.log("[System] Waking The Interrogator...");
    const rawJson = await callAgent(prompt, "The Taskmaster");
    const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.warn("[System Override] API Limit. Injecting Fallback.");
    return {
      requires_clarification: false,
      clarification_message: "",
      dungeons: [{ title: `Fallback: Execute ${userGoal}`, difficulty: "C-Rank", xp_reward: 30 }]
    };
  }
}