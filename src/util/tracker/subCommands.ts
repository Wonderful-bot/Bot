import { EmbedBuilder } from "discord.js";
import { APIEmbedField, ChatInputCommandInteraction } from "discord.js";
import { discordTimestamp } from "../misc/time";
import { trackerGames, trackerLogs, trackerUsers } from "../../db";
import { config } from "../../config";
import { makeTimeString } from "./helper";
import { GAMENOENTRY, USERNOENTRY, USERNOGAMEENTRY } from "./messages";

export async function playtime(interaction: ChatInputCommandInteraction) {
	// get target user and game
	const targetUser = interaction.options.getUser("user");
	const targetGame = interaction.options.getString("game");
	let text = ""; // used later in the final embed

	// make matching text for each case
	if (!targetUser && !targetGame) {
		// no user, no game
		let playtime = 0;
		// count all played times of all games together
		trackerGames.array().forEach((game) => (playtime += game.playtime));
		text = `The whole system has tracked ${makeTimeString(playtime)} of playtime`;
	} else if (!targetUser && targetGame) {
		// no user, game
		// load db and get target game
		const db = trackerGames.get(targetGame.toLowerCase());
		if (!db) {
			await interaction.reply(GAMENOENTRY);
			return;
		}
		text = `${targetGame} has ${makeTimeString(db.playtime)} of playtime`;
	} else if (targetUser && !targetGame) {
		// user, no game
		// load db and get target user
		const db = trackerUsers.get(targetUser.id);
		if (!db) {
			await interaction.reply(USERNOENTRY);
			return;
		}
		text = `${targetUser.username} has ${makeTimeString(db.playtime)} of playtime`;
	} else if (targetUser && targetGame) {
		// user, game
		// load db and get user.games and find target game in there
		const db = trackerUsers
			.get(targetUser.id)
			?.games.find((g) => g.id.toLowerCase() == targetGame.toLowerCase());
		if (!db) {
			await interaction.reply(USERNOGAMEENTRY);
			return;
		}
		text = `${targetUser.username} has ${makeTimeString(db.playtime)} of playtime in ${targetGame}`;
	} else {
		// shouldnt happen but just in case a return
		return;
	}

	await interaction.reply({
		embeds: [new EmbedBuilder().setTitle(text).setColor(config.color)],
	});
}
export async function logs(interaction: ChatInputCommandInteraction) {
	// get target user and game
	const targetUser = interaction.options.getUser("user");
	const targetGame = interaction.options.getString("game");
	let text = ""; // used later in the final embed

	// make matching text for each case
	if (!targetUser && !targetGame) {
		// no u ser, no game
		let logs = 0;
		// count all logs of all games together
		trackerGames.array().forEach((game) => (logs += game.logs));
		text = `The whole system has tracked ${logs} times`;
	} else if (!targetUser && targetGame) {
		// no user, game
		// get target db game entry
		const db = trackerGames.get(targetGame.toLowerCase());
		if (!db) {
			await interaction.reply(GAMENOENTRY);
			return;
		}
		text = `${targetGame} was played ${db.logs} times`;
	} else if (targetUser && !targetGame) {
		// user, no game
		// get target db user entry
		const db = trackerUsers.get(targetUser.id);
		if (!db) {
			await interaction.reply(USERNOENTRY);
			return;
		}
		text = `${targetUser.username} was logged ${db.logs} times`;
	} else if (targetUser && targetGame) {
		// user, game
		// load db and get user.games and find target game in there
		const db = trackerUsers
			.get(targetUser.id)
			?.games.find((g) => g.id.toLowerCase() == targetGame.toLowerCase());
		if (!db) {
			await interaction.reply(USERNOGAMEENTRY);
			return;
		}
		text = `${targetUser.username} has played ${targetGame} ${db.logs} times`;
	} else {
		return;
	}

	await interaction.reply({
		embeds: [new EmbedBuilder().setTitle(text).setColor(config.color)],
	});
}
export async function latest(interaction: ChatInputCommandInteraction) {
	// future embed fields
	const fields: APIEmbedField[] = [];

	// latest system logs
	const logs = trackerLogs.array().slice(0, 5).reverse();
	// make embed for each log
	logs.forEach((log) =>
		fields.push({
			inline: true,
			name: log.gameName,
			value: `user: <@${log.userid}>\ntime: <t:${Math.floor(
				new Date(log.time).getTime() / 1000
			)}:d><t:${Math.floor(new Date(log.time).getTime() / 1000)}:t>\nplayed time: ${makeTimeString(
				log.playtime
			)}`,
		})
	);

	// add empty field for better formating
	fields.push({ inline: true, name: "_ _", value: "_ _" });

	const embed = new EmbedBuilder()
		.setTitle("Latest logs")
		.setColor(config.color)
		.addFields(...fields);

	await interaction.reply({ embeds: [embed] });
}
export async function stats(interaction: ChatInputCommandInteraction) {
	// get 5 most logged games and make string
	const mostLoggedGame = trackerGames
		.array()
		.sort((a, b) => a.logs - b.logs)
		.reverse()
		.slice(0, 5)
		.map((game) => `${trackerLogs.get(game.lastlogs[0])?.gameName}: ${game.logs}`)
		.join("\n");
	// get 5 most played games and make string
	const mostPlayedGame = trackerGames
		.array()
		.sort((a, b) => a.playtime - b.playtime)
		.reverse()
		.slice(0, 5)
		.map((game) => `${trackerLogs.get(game.lastlogs[0])?.gameName}: ${makeTimeString(game.playtime)}`)
		.join("\n");
	// get 5 most logged users and make string
	const mostLoggedUser = trackerUsers
		.array()
		.sort((a, b) => a.logs - b.logs)
		.reverse()
		.splice(0, 5)
		.map((user) => `<@${trackerLogs.get(user.lastlogs[0])?.userid}>: ${user.logs} logs`)
		.join("\n");
	// get 5 most playtime users and make string
	const mostPlayedUser = trackerUsers
		.array()
		.sort((a, b) => a.playtime - b.playtime)
		.reverse()
		.splice(0, 5)
		.map((user) => `<@${trackerLogs.get(user.lastlogs[0])?.userid}>: ${makeTimeString(user.playtime)}`)
		.join("\n");
	// get latest system wide lgos and make string
	const latestLogs = trackerLogs
		.array()
		.reverse()
		.slice(0, 5)
		.map(
			(log) =>
				`<t:${Math.floor(new Date(log.time).getTime() / 1000)}:d><t:${Math.floor(
					new Date(log.time).getTime() / 1000
				)}:t> <@${log.userid}> ${log.gameName}: ${makeTimeString(log.playtime)}`
		)
		.join("\n");
	// get total playtime of all games
	const totalPlaytime = trackerGames
		.array()
		.map((game) => game.playtime)
		.reduce((partialSum, a) => partialSum + a, 0);
	// get amount of logs
	const totalLogs = trackerLogs.count;
	// get amount of games
	const games = trackerGames.count;
	// get amout of users
	const users = trackerUsers.count;
	// get first log               (time is iso string)
	const firstSeen = new Date(trackerLogs.array()[0].time).getTime();
	// make range from first log to now
	const range = Date.now() - firstSeen;
	// calculate average playtime per day/week/month/game/log
	const playtimePer = `day: ${makeTimeString(
		Math.round(totalPlaytime / (range / (86400 * 1000)))
	)}\nweek: ${makeTimeString(Math.round(totalPlaytime / (range / 604800000)))}\nmonth: ${makeTimeString(
		Math.round(totalPlaytime / (range / 2628000000))
	)}\ngame: ${makeTimeString(Math.round(totalPlaytime / games))}\nlog: ${makeTimeString(
		Math.round(totalPlaytime / totalLogs)
	)}`;
	// temporary sorted list based on playtime/log
	const tmp = trackerGames.array().sort((a, b) => b.playtime / b.logs - a.playtime / b.logs)[0];
	// make string from temporary list
	const mostPlaytime = `${trackerLogs.get(tmp.lastlogs[0])?.gameName}: ${makeTimeString(
		tmp.playtime / tmp.logs
	)} - ${tmp.logs} logs\nTotal playtime: ${makeTimeString(tmp.playtime)}`;

	const embed = new EmbedBuilder()
		.setTitle("System stats")
		.setColor(config.color)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.displayAvatarURL({ size: 16 }),
		})
		.setTimestamp(Date.now())
		.addFields(
			{ inline: true, name: "Most logged games", value: mostLoggedGame },
			{ inline: true, name: "Most played games", value: mostPlayedGame },
			{ inline: false, name: "_ _", value: "_ _" },
			{ inline: true, name: "Most logged users", value: mostLoggedUser },
			{ inline: true, name: "Users with most playtime", value: mostPlayedUser },
			{ inline: false, name: "_ _", value: "_ _" },
			{ inline: true, name: "Latest logs", value: latestLogs },
			{ inline: false, name: "_ _", value: "_ _" },
			{ inline: true, name: "(Average) playtime per", value: playtimePer },
			{ inline: true, name: "(Average) most playtime/log", value: mostPlaytime },
			{ inline: false, name: "_ _", value: "_ _" },
			{
				inline: true,
				name: "Record range",
				value: `${discordTimestamp(Math.floor(firstSeen / 1000))} -> ${discordTimestamp(
					Math.floor(Date.now() / 1000)
				)}(now)\n${makeTimeString(Date.now() - firstSeen)}`,
			},
			{ inline: false, name: "_ _", value: "_ _" },
			{ inline: true, name: "Total logs", value: totalLogs.toString() },
			{ inline: true, name: "Total playtime", value: makeTimeString(totalPlaytime) },
			{ inline: false, name: "_ _", value: "_ _" },
			{ inline: true, name: "Total games", value: games.toString() },
			{ inline: true, name: "Total users", value: users.toString() }
		);

	await interaction.reply({ embeds: [embed] });
}
