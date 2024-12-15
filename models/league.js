import mongoose from 'mongoose'

// Define the Team schema
const TeamSchema = new mongoose.Schema({
    team_key: { type: String, required: true, unique: true }, // Unique identifier for the team
    team_name: { type: String, required: true }, // Name of the team
    team_logo: String, // URL to the team's logo
    team_country: String, // Country of the team
    team_founded: String, // Year the team was founded
    venue: {
        venue_name: String,
        venue_address: String,
        venue_city: String,
        venue_capacity: String,
        venue_surface: String, // Surface type (e.g., grass)
    },
    coaches: [{
        coach_name: String,
        coach_country: String,
        coach_age: String,
    }],
    players: [{
        player_key: String,
        player_id: String,
        player_name: String,
        player_age: String,
        player_goals: String,
        player_assists: String,
        player_image: String,
        player_country: String,
        player_position: String,
        player_match_played: String,
        player_red_cards: String,
        player_yellow_cards: String,
        player_injured: String,
        player_rating: String,
    }],
    // Team statistics
    home_statistic: {
        win_percentage: { type: Number, default: 0 },
        draw_percentage: { type: Number, default: 0 },
        loss_percentage: { type: Number, default: 0 },
        avg_goals_first_half: { type: String, default: "0.00" },
        avg_goals_full_match: { type: String, default: "0.00" },
        goal_intervals: {
            "0-15": { type: Number, default: 0 },
            "16-30": { type: Number, default: 0 },
            "31-45": { type: Number, default: 0 },
            "46-60": { type: Number, default: 0 },
            "61-75": { type: Number, default: 0 },
            "76-90": { type: Number, default: 0 },
        },
        cards_statistic: {
            first_half: {
                yellow_card_first_half: { type: String, default: "0.00" },
                red_card_first_half: { type: String, default: "0.00" },
            },
            full_match: {
                yellow_card_full_match: { type: String, default: "0.00" },
                red_card_full_match: { type: String, default: "0.00" },
            },
            second_half: {
                yellow_card_second_half: { type: String, default: "0.00" },
                red_card_second_half: { type: String, default: "0.00" },
            },
        },
        last_5_home_matches: [{
            match_id: String,
        }],
    },
    away_statistic: {
        win_percentage: { type: Number, default: 0 },
        draw_percentage: { type: Number, default: 0 },
        loss_percentage: { type: Number, default: 0 },
        avg_goals_first_half: { type: String, default: "0.00" },
        avg_goals_full_match: { type: String, default: "0.00" },
        goal_intervals: {
            "0-15": { type: Number, default: 0 },
            "16-30": { type: Number, default: 0 },
            "31-45": { type: Number, default: 0 },
            "46-60": { type: Number, default: 0 },
            "61-75": { type: Number, default: 0 },
            "76-90": { type: Number, default: 0 },
        },
        cards_statistic: {
            first_half: {
                yellow_card_first_half: { type: String, default: "0.00" },
                red_card_first_half: { type: String, default: "0.00" },
            },
            full_match: {
                yellow_card_full_match: { type: String, default: "0.00" },
                red_card_full_match: { type: String, default: "0.00" },
            },
            second_half: {
                yellow_card_second_half: { type: String, default: "0.00" },
                red_card_second_half: { type: String, default: "0.00" },
            },
        },
        last_5_away_matches: [{
            match_id: String,
        }],
    },
})

// Define the League schema
const LeagueSchema = new mongoose.Schema({
    league_key: { type: String, required: true, unique: true }, // Unique identifier for the league
    league_name: { type: String, required: true }, // Name of the league
    league_country: String, // Country where the league is based
    league_logo: String, // URL to the league's logo
    league_season: String, // The season of the league (e.g., 2024/2025)
    league_teams: [TeamSchema], // Array of teams (embedded documents)
})

// Create the models
const League = mongoose.model('League', LeagueSchema)

export { League, TeamSchema }
