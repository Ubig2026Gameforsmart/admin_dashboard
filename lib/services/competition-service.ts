import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
    Competition,
    CompetitionListItem,
    CompetitionRound,
    CompetitionGroup,
    GroupMember,
    RoundStatus,
} from "@/types/competition";

const supabase = getSupabaseBrowserClient();

// ===== Competition Service =====

export const competitionService = {
    /**
     * Fetch all competitions with participant count (for list page)
     */
    async getCompetitions(): Promise<CompetitionListItem[]> {
        const { data, error } = await supabase
            .from("competitions")
            .select(`
        id, title, slug, status, registration_start_date, registration_end_date, final_end_date, poster_url, category,
        participants:competition_participants(count)
      `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            slug: d.slug,
            status: d.status,
            regStartDate: d.registration_start_date,
            regEndDate: d.registration_end_date,
            finalEndDate: d.final_end_date,
            posterUrl: d.poster_url,
            category: d.category,
            participantCount: d.participants?.[0]?.count || 0,
        }));
    },

    /**
     * Fetch a single competition by ID
     */
    async getCompetitionById(id: string): Promise<Competition> {
        const { data, error } = await supabase
            .from("competitions")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data as Competition;
    },

    /**
     * Delete a competition by ID
     */
    async deleteCompetition(id: string): Promise<void> {
        const { error } = await supabase.from("competitions").delete().eq("id", id);
        if (error) throw error;
    },
};

// ===== Round Service =====

export const roundService = {
    /**
     * Fetch all rounds for a competition (with groups and members)
     */
    async getRounds(competitionId: string): Promise<CompetitionRound[]> {
        const { data, error } = await supabase
            .from("competition_rounds")
            .select(`
        *,
        groups:competition_groups(
          *,
          members:competition_group_members(*)
        )
      `)
            .eq("competition_id", competitionId)
            .order("round_order", { ascending: true });

        if (error) throw error;
        return (data || []) as CompetitionRound[];
    },

    /**
     * Create a new round
     */
    async createRound(
        id: string,
        competitionId: string,
        name: string,
        roundOrder: number
    ): Promise<CompetitionRound> {
        const { data, error } = await supabase
            .from("competition_rounds")
            .insert({
                id,
                competition_id: competitionId,
                name,
                round_order: roundOrder,
                status: "pending" as RoundStatus,
            })
            .select()
            .single();

        if (error) throw error;
        return data as CompetitionRound;
    },

    /**
     * Update round status
     */
    async updateRoundStatus(roundId: string, status: RoundStatus): Promise<void> {
        const { error } = await supabase
            .from("competition_rounds")
            .update({ status })
            .eq("id", roundId);

        if (error) throw error;
    },

    /**
     * Delete a round
     */
    async deleteRound(roundId: string): Promise<void> {
        const { error } = await supabase
            .from("competition_rounds")
            .delete()
            .eq("id", roundId);

        if (error) throw error;
    },
};

// ===== Group Service =====

export const groupService = {
    /**
     * Create a new group within a round
     */
    async createGroup(
        id: string,
        roundId: string,
        name: string
    ): Promise<CompetitionGroup> {
        const { data, error } = await supabase
            .from("competition_groups")
            .insert({ id, round_id: roundId, name })
            .select()
            .single();

        if (error) throw error;
        return data as CompetitionGroup;
    },

    /**
     * Assign quiz IDs to a group
     */
    async assignQuizzes(groupId: string, quizIds: string[]): Promise<void> {
        const { error } = await supabase
            .from("competition_groups")
            .update({ quiz_ids: quizIds })
            .eq("id", groupId);

        if (error) throw error;
    },

    /**
     * Delete a group
     */
    async deleteGroup(groupId: string): Promise<void> {
        const { error } = await supabase
            .from("competition_groups")
            .delete()
            .eq("id", groupId);

        if (error) throw error;
    },
};

// ===== Group Member Service =====

export const memberService = {
    /**
     * Add members to a group (bulk insert)
     */
    async addMembers(
        members: { id: string; group_id: string; participant_id: string }[]
    ): Promise<void> {
        const { error } = await supabase
            .from("competition_group_members")
            .insert(members);

        if (error) throw error;
    },

    /**
     * Update score of a member
     */
    async updateScore(memberId: string, score: number): Promise<void> {
        const { error } = await supabase
            .from("competition_group_members")
            .update({ score })
            .eq("id", memberId);

        if (error) throw error;
    },

    /**
     * Mark members as advanced (bulk update)
     */
    async advanceMembers(memberIds: string[]): Promise<void> {
        const { error } = await supabase
            .from("competition_group_members")
            .update({ is_advanced: true })
            .in("id", memberIds);

        if (error) throw error;
    },
};
