import axios from 'axios'
import { logger } from './logger.service.js'
import { config } from 'dotenv'
import { dbService } from './db.service.js'
import { _matchService } from '../api/match/match.service.js'

config()

const BASE_URL = process.env.BASE_URL
const API_KEY = process.env.API_KEY

export const fetchData = async () => {
    fetchPastMatches()
    fetchFutureMatches()
    fetchAndCalculateLeagueData()
}


// Main function to fetch and calculate data
const fetchAndCalculateLeagueData = async () => {
    try {
        // Step 1: Fetch leagues data
        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_leagues',
                APIkey: API_KEY
            }
        })
        const leagues = Array.isArray(response.data) ? response.data.filter(league => league.league_id == 3 || league.league_id == 202) : []
        // const leagues = Array.isArray(response.data) ? response.data : []

        // Step 2: Fetch teams and matches for each league
        await Promise.all(leagues.map(async (league) => {
            const teams = await _fetchTeamsByLeagueId(league.league_id)
        
            league.league_teams = await Promise.all(teams.map(async (team) => {
                const teamData = await _fetchTeamMatches(team.team_key, league.league_id)
                return { ...team, ...teamData }
            }))
        }))
        await dbService.saveLeagueData(leagues)

        // Step 4: Return the data
    } catch (error) {
        logger.error('Error fetching or calculating league data:', error)
    }
}

// Helper function to fetch teams by league ID
async function _fetchTeamsByLeagueId(leagueId) {
    try {
        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_teams',
                league_id: leagueId,
                APIkey: API_KEY
            }
        })
        return Array.isArray(response.data) ? response.data : []
    } catch (error) {
        logger.error(`Error fetching teams for league ${leagueId}:`, error)
        return []
    }
}

// Helper function to fetch team matches and calculate statistics
async function _fetchTeamMatches(teamId, leagueId) {
    try {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setMonth(today.getMonth() - 6); // 6 months ago

        const formatDate = (date) => date.toISOString().split('T')[0]

        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_events',
                APIkey: API_KEY,
                team_id: teamId,
                league_id: leagueId,
                from: formatDate(fromDate),
                to: formatDate(today),
            }
        })

        const matches = Array.isArray(response.data) ? response.data : []

        // Filter matches for home and away teams
        const homeMatches = matches
            .filter(match => match.match_hometeam_id === teamId)
            .slice(0, 6)
            .map(match => ({ match_id: match.match_id }))

        const awayMatches = matches
            .filter(match => match.match_awayteam_id === teamId)
            .slice(0, 6)
            .map(match => ({ match_id: match.match_id }))

        // Step 5: Calculate team statistics
        const homeStats = await _calculateTeamStatistics(homeMatches, teamId, 'home')
        const awayStats = await _calculateTeamStatistics(awayMatches, teamId, 'away')

        return {
            last_5_home_matches: homeMatches,
            last_5_away_matches: awayMatches,
            home_statistic: homeStats,
            away_statistic: awayStats,
        };
    } catch (error) {
        logger.error(`Error fetching matches for team ${teamId}:`, error)
        return {
            last_5_home_matches: [],
            last_5_away_matches: [],
            home_statistic: {},
            away_statistic: {},
        }
    }
}

// Helper function to calculate team statistics based on matches
// async function _calculateTeamStatistics(matches, teamId, type) {
//     let winCount = 0, drawCount = 0, lossCount = 0
//     let totalGoalsFirstHalf = 0, totalGoalsFullMatch = 0

//     const fullMatchStatsSum = {}
//     const firstHalfStatsSum = {}

//     const cardsStatistic = {
//         yellow: { first_half: 0, second_half: 0, full_match: 0 },
//         red: { first_half: 0, second_half: 0, full_match: 0 }
//     }

//     const goalIntervals = {
//         "0-15": 0, "16-30": 0, "31-45": 0,
//         "46-60": 0, "61-75": 0, "76-90": 0
//     }

//     // Loop through matches and calculate statistics
//     for (const match of matches) {
//         try {
//             const matchData = await _matchService.getPastMatchById(match.match_id) // Assuming you have a service like this

//             if (matchData && Object.keys(matchData).length > 0) {
//                 const isHome = type === 'home'
//                 const teamScoreFirstHalf = isHome
//                     ? parseInt(matchData.match_hometeam_halftime_score, 10) || 0
//                     : parseInt(matchData.match_awayteam_halftime_score, 10) || 0
//                 const teamScoreFullMatch = isHome
//                     ? parseInt(matchData.match_hometeam_ft_score, 10) || 0
//                     : parseInt(matchData.match_awayteam_ft_score, 10) || 0
//                 const opponentScore = isHome
//                     ? parseInt(matchData.match_awayteam_ft_score, 10) || 0
//                     : parseInt(matchData.match_hometeam_ft_score, 10) || 0

//                 // Win/draw/loss calculation
//                 if (teamScoreFullMatch > opponentScore) winCount++
//                 else if (teamScoreFullMatch === opponentScore) drawCount++
//                 else lossCount++

//                 totalGoalsFirstHalf += teamScoreFirstHalf
//                 totalGoalsFullMatch += teamScoreFullMatch

//                 // Process statistics (example: goals, cards)
//                 if (Array.isArray(matchData.statistics)) {
//                     matchData.statistics.forEach((stat) => {
//                         const statValue = isHome
//                             ? parseInt(stat.home, 10) || 0
//                             : parseInt(stat.away, 10) || 0

//                         if (!fullMatchStatsSum[stat.type]) {
//                             fullMatchStatsSum[stat.type] = { sum: 0, count: 0 }
//                         }
//                         fullMatchStatsSum[stat.type].sum += statValue
//                         fullMatchStatsSum[stat.type].count++
//                     })
//                 }

//                 if (Array.isArray(matchData.statistics_1half)) {
//                     matchData.statistics_1half.forEach((stat) => {
//                         const statValue = isHome
//                             ? parseInt(stat.home, 10) || 0
//                             : parseInt(stat.away, 10) || 0

//                         if (!firstHalfStatsSum[stat.type]) {
//                             firstHalfStatsSum[stat.type] = { sum: 0, count: 0 }
//                         }
//                         firstHalfStatsSum[stat.type].sum += statValue
//                         firstHalfStatsSum[stat.type].count++
//                     })
//                 }

//                 if (Array.isArray(matchData.cards)) {
//                     matchData.cards.forEach((card) => {
//                         const isTeamCard = (isHome && card.home_fault) || (!isHome && card.away_fault)
//                         if (!isTeamCard) return

//                         const cardMinute = parseInt(card.minute, 10) || 0
//                         const isFirstHalf = cardMinute <= 45

//                         if (card.card === 'yellow card') {
//                             cardsStatistic.yellow.full_match++
//                             if (isFirstHalf) cardsStatistic.yellow.first_half++
//                             else cardsStatistic.yellow.second_half++
//                         } else if (card.card === 'red card') {
//                             cardsStatistic.red.full_match++
//                             if (isFirstHalf) cardsStatistic.red.first_half++
//                             else cardsStatistic.red.second_half++
//                         }
//                     })
//                 }

//                 if (Array.isArray(matchData.goalscorer)) {
//                     matchData.goalscorer.forEach((goal) => {
//                         const isTeamScorer = (isHome && goal.home_scorer_id) || (!isHome && goal.away_scorer_id)
//                         if (!isTeamScorer) return

//                         const goalTime = parseInt(goal.time, 10)
//                         if (goalTime >= 0 && goalTime <= 15) goalIntervals['0-15']++
//                         else if (goalTime >= 16 && goalTime <= 30) goalIntervals['16-30']++
//                         else if (goalTime >= 31 && goalTime <= 45) goalIntervals['31-45']++
//                         else if (goalTime >= 46 && goalTime <= 60) goalIntervals['46-60']++
//                         else if (goalTime >= 61 && goalTime <= 75) goalIntervals['61-75']++
//                         else if (goalTime >= 76 && goalTime <= 90) goalIntervals['76-90']++
//                     })
//                 }
//             }
//         } catch (error) {
//             logger.warn(`Error fetching data for match ID ${match.match_id}:`, error)
//         }
//     }

//     const totalMatches = matches.length || 1

//     const teamStatistics = {
//         win_percentage: parseFloat(((winCount / totalMatches) * 100).toFixed(2)),
//         draw_percentage: parseFloat(((drawCount / totalMatches) * 100).toFixed(2)),
//         loss_percentage: parseFloat(((lossCount / totalMatches) * 100).toFixed(2)),
//         total_goals_first_half: parseFloat((totalGoalsFirstHalf / totalMatches).toFixed(2)),
//         total_goals_full_match: parseFloat((totalGoalsFullMatch / totalMatches).toFixed(2)),
//         full_match_stats_avg: fullMatchStatsSum,
//         first_half_stats_avg: firstHalfStatsSum,
//         cards_stat: cardsStatistic,
//         goal_intervals: goalIntervals
//     };

//     return teamStatistics
// }

// Function to fetch past matches

async function _calculateTeamStatistics(matches, teamId, type) {
    let winCount = 0, drawCount = 0, lossCount = 0;
    let totalGoalsFirstHalf = 0, totalGoalsFullMatch = 0;

    const fullMatchStatsSum = {};
    const firstHalfStatsSum = {};

    const cardsStatistic = {
        yellow: { first_half: 0, second_half: 0, full_match: 0 },
        red: { first_half: 0, second_half: 0, full_match: 0 }
    };

    const goalIntervals = {
        "0-15": 0, "16-30": 0, "31-45": 0,
        "46-60": 0, "61-75": 0, "76-90": 0
    };

    for (const match of matches) {
        try {
            const matchData = await _matchService.getPastMatchById(match.match_id);

            if (matchData && Object.keys(matchData).length > 0) {
                const isHome = type === 'home';
                const teamScoreFirstHalf = isHome
                    ? parseInt(matchData.match_hometeam_halftime_score, 10) || 0
                    : parseInt(matchData.match_awayteam_halftime_score, 10) || 0;
                const teamScoreFullMatch = isHome
                    ? parseInt(matchData.match_hometeam_ft_score, 10) || 0
                    : parseInt(matchData.match_awayteam_ft_score, 10) || 0;
                const opponentScore = isHome
                    ? parseInt(matchData.match_awayteam_ft_score, 10) || 0
                    : parseInt(matchData.match_hometeam_ft_score, 10) || 0;

                // Win/draw/loss calculation
                if (teamScoreFullMatch > opponentScore) winCount++;
                else if (teamScoreFullMatch === opponentScore) drawCount++;
                else lossCount++;

                totalGoalsFirstHalf += teamScoreFirstHalf;
                totalGoalsFullMatch += teamScoreFullMatch;

                // Accumulate statistics
                if (Array.isArray(matchData.statistics)) {
                    matchData.statistics.forEach(stat => {
                        const statValue = isHome
                            ? parseInt(stat.home, 10) || 0
                            : parseInt(stat.away, 10) || 0;

                        if (!fullMatchStatsSum[stat.type]) {
                            fullMatchStatsSum[stat.type] = { sum: 0, count: 0 };
                        }
                        fullMatchStatsSum[stat.type].sum += statValue;
                        fullMatchStatsSum[stat.type].count++;
                    });
                }

                if (Array.isArray(matchData.statistics_1half)) {
                    matchData.statistics_1half.forEach(stat => {
                        const statValue = isHome
                            ? parseInt(stat.home, 10) || 0
                            : parseInt(stat.away, 10) || 0;

                        if (!firstHalfStatsSum[stat.type]) {
                            firstHalfStatsSum[stat.type] = { sum: 0, count: 0 };
                        }
                        firstHalfStatsSum[stat.type].sum += statValue;
                        firstHalfStatsSum[stat.type].count++;
                    });
                }

                // Process cards
                if (Array.isArray(matchData.cards)) {
                    matchData.cards.forEach(card => {
                        const isTeamCard = (isHome && card.home_fault) || (!isHome && card.away_fault);
                        if (!isTeamCard) return;

                        const cardMinute = parseInt(card.minute, 10) || 0;
                        const isFirstHalf = cardMinute <= 45;

                        if (card.card === 'yellow card') {
                            cardsStatistic.yellow.full_match++;
                            if (isFirstHalf) cardsStatistic.yellow.first_half++;
                            else cardsStatistic.yellow.second_half++;
                        } else if (card.card === 'red card') {
                            cardsStatistic.red.full_match++;
                            if (isFirstHalf) cardsStatistic.red.first_half++;
                            else cardsStatistic.red.second_half++;
                        }
                    });
                }

                // Process goalscorer
                if (Array.isArray(matchData.goalscorer)) {
                    matchData.goalscorer.forEach(goal => {
                        const isTeamScorer = (isHome && goal.home_scorer_id) || (!isHome && goal.away_scorer_id);
                        if (!isTeamScorer) return;

                        const goalTime = parseInt(goal.time, 10);
                        if (goalTime >= 0 && goalTime <= 15) goalIntervals["0-15"]++;
                        else if (goalTime >= 16 && goalTime <= 30) goalIntervals["16-30"]++;
                        else if (goalTime >= 31 && goalTime <= 45) goalIntervals["31-45"]++;
                        else if (goalTime >= 46 && goalTime <= 60) goalIntervals["46-60"]++;
                        else if (goalTime >= 61 && goalTime <= 75) goalIntervals["61-75"]++;
                        else if (goalTime >= 76 && goalTime <= 90) goalIntervals["76-90"]++;
                    });
                }
            }
        } catch (error) {
            logger.warn(`Error fetching data for match ID ${match.match_id}:`, error);
        }
    }

    const totalMatches = matches.length || 1;

    return {
        win_percentage: parseFloat(((winCount / totalMatches) * 100).toFixed(2)),
        draw_percentage: parseFloat(((drawCount / totalMatches) * 100).toFixed(2)),
        loss_percentage: parseFloat(((lossCount / totalMatches) * 100).toFixed(2)),
        avg_goals_first_half: (totalGoalsFirstHalf / totalMatches).toFixed(2),
        avg_goals_full_match: (totalGoalsFullMatch / totalMatches).toFixed(2),
        goal_intervals: goalIntervals,
        cards_statistic: {
            first_half: {
                yellow_card_first_half: (cardsStatistic.yellow.first_half / totalMatches).toFixed(2),
                red_card_first_half: (cardsStatistic.red.first_half / totalMatches).toFixed(2),
            },
            second_half: {
                yellow_card_second_half: (cardsStatistic.yellow.second_half / totalMatches).toFixed(2),
                red_card_second_half: (cardsStatistic.red.second_half / totalMatches).toFixed(2),
            },
            full_match: {
                yellow_card_full_match: (cardsStatistic.yellow.full_match / totalMatches).toFixed(2),
                red_card_full_match: (cardsStatistic.red.full_match / totalMatches).toFixed(2)
            }
        },
        avg_statistics: Object.keys(fullMatchStatsSum).reduce((acc, type) => {
            const { sum, count } = fullMatchStatsSum[type];
            const avg = sum / count;
            if (avg > 0) acc[type] = parseFloat(avg.toFixed(2));
            return acc;
        }, {}),
        avg_first_half_statistics: Object.keys(firstHalfStatsSum).reduce((acc, type) => {
            const { sum, count } = firstHalfStatsSum[type];
            const avg = sum / count;
            if (avg > 0) acc[type] = parseFloat(avg.toFixed(2));
            return acc;
        }, {})
    };
}


const fetchPastMatches = async () => {
    try {
        const today = new Date()
        const fromDate = new Date()
        fromDate.setMonth(today.getMonth() - 6)  // Fetch past matches from the last 6 months

        const formatDate = (date) => date.toISOString().split('T')[0]

        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_events',
                APIkey: API_KEY,
                from: formatDate(fromDate),
                to: formatDate(today),
            }
        })

        const matches = Array.isArray(response.data) ? response.data.filter(match => match.league_id == 3 || match.league_id == 202) : []
        await dbService.savePastMatchData(matches) 
    } catch (error) {
        logger.error(`Error fetching past matches`, error)
        return []
    }
}

// Function to fetch future matches
const fetchFutureMatches = async () => {
    try {
        const today = new Date()
        const nextDate = new Date()
       nextDate.setMonth(today.getMonth() + 2)  // Fetch future matches for the next 2 month

        const formatDate = (date) => date.toISOString().split('T')[0]

        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_events',
                APIkey: API_KEY,
                from: formatDate(today),
                to: formatDate(nextDate),
            }
        })

        const matches = Array.isArray(response.data) ? response.data.filter(match => match.league_id == 3 || match.league_id == 202) : []
        await dbService.saveFutureMatchData(matches) 
    } catch (error) {
        logger.error(`Error fetching future matches for team`, error)
        return []
    }
}