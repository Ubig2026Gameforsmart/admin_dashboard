"use server";

import { createClient } from "@supabase/supabase-js";
import { GameRegistry } from "@/lib/game-registry";
import { generateXID } from "@/lib/id-generator";

// Initialize Supabase Admin strictly for Server Actions to bypass RLS for critical inserts
const supabaseMainUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseMainKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseMain = createClient(supabaseMainUrl, supabaseMainKey);

// Define parameter types
interface StartRoundParams {
  competitionId: string;
  groupId: string;
  groupName: string;
  roundIndex: number;
  quizId: string | null;
  gameId: string | null;
  participants: Array<{ id: string; user_id: string;[key: string]: any }>;
  hostId: string;
}

export async function startRoundSession(params: StartRoundParams) {
  try {
    // 0. Check for existing session first to prevent duplicates!
    const { data: cgData } = await supabaseMain
      .from("competition_groups")
      .select("rounds")
      .eq("id", params.groupId)
      .single();

    const existingRound = cgData?.rounds ? cgData.rounds[params.roundIndex] : null;

    let sessionXId = generateXID();
    let newMainGroupId = generateXID();
    let gamePin = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    let isReusingSession = false;

    if (existingRound && existingRound.session_id) {
      // Resume existing match
      sessionXId = existingRound.session_id;
      gamePin = existingRound.game_pin || gamePin;
      newMainGroupId = existingRound.lobby_id || generateXID();
      isReusingSession = true;
    }

    // Extract participant IDs
    const participantIds = params.participants.map(p => p.id);

    // *CRITICAL*: Resolve actual `user_id` from competition_participants
    const { data: dbParticipants, error: pError } = await supabaseMain
      .from('competition_participants')
      .select('id, user_id')
      .in('id', participantIds);

    if (pError) throw new Error(`Failed to resolve users: ${pError.message}`);

    const resolvedUsers = (dbParticipants || []).filter(dp => dp.user_id);

    // 2. Prepare Main Group (Lobby)
    // Add all participants to the group so the host can see them in 'Undang Grup' list inside Axiom
    const members = [
      { id: params.hostId, role: "admin" },
      ...resolvedUsers.map((u) => ({ id: u.user_id, role: "member" }))
    ];

    const groupPayload = {
      id: newMainGroupId,
      name: `${params.groupName} - Round ${params.roundIndex + 1}`,
      description: "Match Lobby",
      creator_id: params.hostId,
      members: members,
      settings: { status: "private" },
    };

    // 3. Prepare Notifications for all users EXCEPT the host
    // Sending it to the host will cause the Axiom client to auto-decline it, since the host is already in the lobby.
    const notificationReceivers = resolvedUsers.filter(u => u.user_id !== params.hostId);

    const notifications = notificationReceivers.map((u) => ({
      user_id: u.user_id,
      actor_id: params.hostId,
      type: "sessionGroup", // <-- Diubah menjadi sessionGroup
      entity_type: "session",
      entity_id: sessionXId,
      from_group_id: newMainGroupId,
      status: null,
      content: null
    }));

    // Fetch Quiz Data for quiz_detail (required for GameForSmart UI)
    let quizDetail = null;
    if (params.quizId) {
      const { data: quizData } = await supabaseMain
        .from("quizzes")
        .select("id, title, description, category, language, image_url, profiles ( username, avatar_url )")
        .eq("id", params.quizId)
        .single();
        
      if (quizData) {
        const profileData = Array.isArray(quizData.profiles)
          ? quizData.profiles[0]
          : quizData.profiles;
          
        quizDetail = {
          title:            quizData.title,
          description:      quizData.description || null,
          category:         quizData.category || "general",
          language:         quizData.language || "id",
          image:            quizData.image_url || null,
          creator_username: profileData?.username || "Unknown",
          creator_avatar:   profileData?.avatar_url || null
        };
      }
    }

    // 4. Prepare Main Game Session Payload
    const mainSessionPayload = {
      id: sessionXId,
      quiz_id: params.quizId,
      host_id: params.hostId,
      game_pin: gamePin,
      status: "waiting",
      total_time_minutes: 5,
      question_limit: "5",
      game_end_mode: "first_finish",
      allow_join_after_start: false,
      participants: [],
      responses: [],
      current_questions: [],
      application: params.gameId || "axiom", // fallback
      quiz_detail: quizDetail,
    };

    const lookupGameId = params.gameId ? params.gameId.toLowerCase() : "axiom";
    const gameIntegration = GameRegistry[lookupGameId];

    // --- EXECUTE MAIN DATABASE INSERTS ---
    if (!isReusingSession) {
      // 1. Must insert group FIRST to satisfy foreign-key constraint on notifications
      const { error: groupErr } = await supabaseMain.from("groups").insert(groupPayload);
      if (groupErr) throw new Error(`Group creation failed: ${groupErr.message}`);

      // 2. Must insert game session SECOND so entity_id constraint avoids race condition
      const { error: sessionErr } = await supabaseMain.from("game_sessions").insert(mainSessionPayload);
      if (sessionErr) throw new Error(`Session creation failed: ${sessionErr.message}`);

      // 3. Finally insert notifications
      const { error: notifErr } = await supabaseMain.from("notifications").insert(notifications);
      if (notifErr) throw new Error(`Notification creation failed: ${notifErr.message}`);

      // --- GAME SPECIFIC INSERT (E.g. Axiom) ---
      if (gameIntegration && gameIntegration.initializeSession) {
        const initRes = await gameIntegration.initializeSession({
          quizId: params.quizId || undefined,
          groupId: params.groupId,
          competitionId: params.competitionId,
          roundIndex: params.roundIndex,
          groupName: params.groupName,
          generatedSessionId: sessionXId,
          gamePin: gamePin,
          hostId: params.hostId,
        });

        if (!initRes.success) {
          // Rollback Main Session if game specific fails
          await supabaseMain.from("game_sessions").delete().eq("id", sessionXId);
          throw new Error(`Game DB initialization failed: ${initRes.error}`);
        }
      }

      // --- STAMP session_id INTO competition_groups.rounds JSONB ---
      if (cgData?.rounds) {
        const updatedRounds = [...cgData.rounds];
        if (updatedRounds[params.roundIndex]) {
          updatedRounds[params.roundIndex] = {
            ...updatedRounds[params.roundIndex],
            session_id: sessionXId,
            game_pin: gamePin,
            lobby_id: newMainGroupId,
          };
        }
        await supabaseMain
          .from("competition_groups")
          .update({ rounds: updatedRounds })
          .eq("id", params.groupId);
      }
    } else {
      // IF REUSING SESSION:
      // We only insert notifications so users get re-invited.
      const notifRes = await supabaseMain.from("notifications").insert(notifications);
      if (notifRes.error) console.error("Failed to resend notifications:", notifRes.error);
    }

    // --- SUCCESS: GENERATE REDIRECT URL ---
    const redirectUrl = gameIntegration
      ? gameIntegration.getRedirectUrl({
        quizId: params.quizId || undefined,
        generatedSessionId: sessionXId,
        gamePin: gamePin,
      })
      : `https://app.gameforsmart.com/host/${sessionXId}/settings`;

    return { success: true, redirectUrl };

  } catch (error: any) {
    console.error("Failed to start round session:", error);
    return { success: false, error: error.message };
  }
}
