const mongoose = require('mongoose')

// Define the match schema
const matchSchema = new mongoose.Schema({
  match_id: { type: String, required: true },
  country_id: { type: String, required: true },
  country_name: { type: String, required: true },
  league_id: { type: String, required: true },
  league_name: { type: String, required: true },
  match_date: { type: Date, required: true },
  match_status: { type: String, required: true },
  match_time: { type: String, required: true },
  match_hometeam_id: { type: String, required: true },
  match_hometeam_name: { type: String, required: true },
  match_hometeam_score: { type: String, required: true },
  match_awayteam_name: { type: String, required: true },
  match_awayteam_id: { type: String, required: true },
  match_awayteam_score: { type: String, required: true },
  match_hometeam_halftime_score: { type: String },
  match_awayteam_halftime_score: { type: String },
  match_hometeam_extra_score: { type: String },
  match_awayteam_extra_score: { type: String },
  match_hometeam_penalty_score: { type: String },
  match_awayteam_penalty_score: { type: String },
  match_hometeam_system: { type: String },
  match_awayteam_system: { type: String },
  match_live: { type: String },
  match_round: { type: String },
  match_stadium: { type: String },
  match_referee: { type: String },
  team_home_badge: { type: String },
  team_away_badge: { type: String },
  league_logo: { type: String },
  country_logo: { type: String },
  league_year: { type: String },
  fk_stage_key: { type: String },
  stage_name: { type: String },
  goalscorer: [
    {
      time: { type: String },
      home_scorer: { type: String },
      home_scorer_id: { type: String },
      home_assist: { type: String },
      home_assist_id: { type: String },
      score: { type: String },
      away_scorer: { type: String },
      away_scorer_id: { type: String },
      away_assist: { type: String },
      away_assist_id: { type: String },
      info: { type: String },
      score_info_time: { type: String },
    }
  ],
  cards: [
    {
      time: { type: String },
      home_fault: { type: String },
      card: { type: String },
      away_fault: { type: String },
      info: { type: String },
      home_player_id: { type: String },
      away_player_id: { type: String },
      score_info_time: { type: String },
    }
  ],
  substitutions: {
    home: [
      {
        time: { type: String },
        substitution: { type: String },
        substitution_player_id: { type: String },
      }
    ],
    away: [
      {
        time: { type: String },
        substitution: { type: String },
        substitution_player_id: { type: String },
      }
    ]
  },
  lineup: {
    home: {
      starting_lineups: [
        {
          lineup_player: { type: String },
          lineup_number: { type: String },
          lineup_position: { type: String },
          player_key: { type: String },
        }
      ],
      substitutes: [
        {
          lineup_player: { type: String },
          lineup_number: { type: String },
          lineup_position: { type: String },
          player_key: { type: String },
        }
      ],
      coach: [
        {
          lineup_player: { type: String },
          lineup_number: { type: String },
          lineup_position: { type: String },
          player_key: { type: String },
        }
      ],
      missing_players: [{ type: String }],
    },
    away: {
      starting_lineups: [
        {
          lineup_player: { type: String },
          lineup_number: { type: String },
          lineup_position: { type: String },
          player_key: { type: String },
        }
      ],
      substitutes: [
        {
          lineup_player: { type: String },
          lineup_number: { type: String },
          lineup_position: { type: String },
          player_key: { type: String },
        }
      ],
      coach: [
        {
          lineup_player: { type: String },
          lineup_number: { type: String },
          lineup_position: { type: String },
          player_key: { type: String },
        }
      ],
      missing_players: [{ type: String }],
    },
  },
  statistics: [
    {
      type: { type: String },
      home: { type: String },
      away: { type: String },
    }
  ]
});

// Create the model
const Match = mongoose.model('Match', matchSchema)

export { Match }