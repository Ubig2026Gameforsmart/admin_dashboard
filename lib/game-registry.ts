import { createClient } from "@supabase/supabase-js";

// Database clients for specific games (Realtime shards)
const axiomSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_AXIOM;
const axiomSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_AXIOM;

export const axiomSupabase = 
  axiomSupabaseUrl && axiomSupabaseKey 
    ? createClient(axiomSupabaseUrl, axiomSupabaseKey)
    : null;

const gfsSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL_Gameforsmart;
const gfsSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY_Gameforsmart;

export const gfsSupabase = 
  gfsSupabaseUrl && gfsSupabaseKey 
    ? createClient(gfsSupabaseUrl, gfsSupabaseKey)
    : null;

// The data passed to the registry when starting a game
export interface GameSessionContext {
  quizId?: string;
  groupId?: string;
  competitionId?: string;
  roundIndex?: number;
  groupName?: string;
  // Dashboard commonly generates Session ID & Game PIN beforehand
  generatedSessionId?: string; 
  gamePin?: string; // The 6-digit room code
  hostId?: string; // The user ID of the admin/host
}

// Interface for each game's integration config
export interface GameIntegration {
  name: string;
  
  /**
   * Optional: Logic to inject/insert the room/session directly into the game's specific Supabase 
   * (e.g., establishing a "status: waiting" room in Axiom's Realtime DB)
   */
  initializeSession?: (context: GameSessionContext) => Promise<{ success: boolean; data?: Record<string, any> | null; error?: any }>;
  
  /**
   * Returns the final URL the Admin Dashboard should open in a new tab
   */
  getRedirectUrl: (context: GameSessionContext) => string;
}

const gfsIntegration: GameIntegration = {
  name: "Quiz V2 (GameForSmart Main)",
  
  initializeSession: async (context) => {
    if (!gfsSupabase) {
      return { success: false, error: "GameForSmart Supabase environment variables missing." };
    }
    
    const payload = {
      id: context.generatedSessionId,
      game_pin: context.gamePin,
      quiz_id: context.quizId || "",
      status: "waiting",
      host_id: context.hostId || "",
      total_time_minutes: 5,
      game_end_mode: "first_finish",
      allow_join_after_start: false,
      question_limit: "5",
      application: "Quiz V2",
    };
    
    // GFS typically uses 'game_sessions_rt'
    const { data, error } = await gfsSupabase.from('game_sessions_rt').insert(payload);
    
    if (error) {
      console.error("GameForSmart DB Insert Error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  getRedirectUrl: (context) => {
    // Uses the generatedSessionId (XID) according to the user's requirement
    return `https://app.gameforsmart.com/host/${context.generatedSessionId}/settings`;
  }
};

const zigmaSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_ZIGMA;
const zigmaSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_ZIGMA;

export const zigmaSupabase = 
  zigmaSupabaseUrl && zigmaSupabaseKey 
    ? createClient(zigmaSupabaseUrl, zigmaSupabaseKey)
    : null;

const zigmaIntegration: GameIntegration = {
  name: "Zigma",
  
  initializeSession: async (context) => {
    if (!zigmaSupabase) {
      return { success: false, error: "Zigma Supabase environment variables missing." };
    }
    
    // Zigma uses a 'sessions' table exactly like Axiom pattern based on inspection
    const payload = {
      id: context.generatedSessionId,
      game_pin: context.gamePin,
      quiz_id: context.quizId || "",
      status: "waiting",
      host_id: context.hostId || "",
      difficulty: "easy",
      question_limit: 5,
      total_time_minutes: 5,
      current_questions: []
    };
    
    const { data, error } = await zigmaSupabase.from('sessions').insert(payload);
    
    if (error) {
      console.error("Zigma DB Insert Error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  getRedirectUrl: (context) => {
    // Return standard Zigma host URL format defined securely matching user specification 
    // They requested: `https://zigma.gameforsmart.com/host/settings` with pin usually
    // By matching Axiom pattern we send them to targetPin/settings or generatedId 
    // Wait, the user specifically wrote: `https://zigma.gameforsmart.com/host/settings`
    // So let's provide exactly that, but standard is `host/[session_or_pin]/settings`.
    // If Zigma doesn't need ID in URL path:
    const targetPin = context.gamePin || "INVALID_PIN";
    return `https://zigma.gameforsmart.com/host/${targetPin}/settings`;
  }
};

export const GameRegistry: Record<string, GameIntegration> = {
  // Application ID is the key (as stored in game_sessions.application)
  "axiom": {
    name: "Axiom (Astro Learn)",
    
    initializeSession: async (context) => {
      if (!axiomSupabase) {
        return { success: false, error: "Axiom Supabase environment variables missing." };
      }
      
      const payload = {
        id: context.generatedSessionId,
        game_pin: context.gamePin,
        quiz_id: context.quizId || "",
        status: "waiting",
        host_id: context.hostId || "",
        difficulty: "easy",
        question_limit: 5,
        total_time_minutes: 5,
        current_questions: []
      };
      
      const { data, error } = await axiomSupabase.from('sessions').insert(payload);
      
      if (error) {
        console.error("Axiom DB Insert Error:", error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    },

    getRedirectUrl: (context) => {
      const targetPin = context.gamePin || "INVALID_PIN";
      return `https://axiom.gameforsmart.com/host/${targetPin}/settings`;
    }
  },

  // Map alternative names for GameForSmart
  "quiz v2": gfsIntegration,
  "quiz_v2": gfsIntegration,
  "gameforsmart": gfsIntegration,
  
  // Zigma
  "zigma": zigmaIntegration,
};
