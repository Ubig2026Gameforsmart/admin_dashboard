import { createClient } from "@supabase/supabase-js";

// Database clients for specific games (Realtime shards)
const axiomSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_AXIOM;
const axiomSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_AXIOM;

export const axiomSupabase = 
  axiomSupabaseUrl && axiomSupabaseKey 
    ? createClient(axiomSupabaseUrl, axiomSupabaseKey)
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
  initializeSession?: (context: GameSessionContext) => Promise<{ success: boolean; data?: any; error?: any }>;
  
  /**
   * Returns the final URL the Admin Dashboard should open in a new tab
   */
  getRedirectUrl: (context: GameSessionContext) => string;
}

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

  // TODO: Add zigma, crazyrace, etc. below later:
  // "crazyrace": { ... }
};
