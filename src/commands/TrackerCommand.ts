import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { Command } from "../interactions/interactionClasses";
import { hasAdminPerms } from "../util/misc/permissions";
import { config } from "../config";
import { blacklistAdd, blacklistRemove, blacklistShow } from "../util/tracker/blacklist";
import { statisticsAllstats, statisticsGamestats, statisticsMystats } from "../util/tracker/statistics";
import {
	adminBlacklistgame,
	adminLook,
	adminReset,
	adminShow,
	adminWhitelistgame,
} from "../util/tracker/admin";
import { list } from "../util/tracker/list";

class TrackerCommand extends Command {
	constructor() {
		super("game-activity-tracker");
	}

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const group: string | null = interaction.options.getSubcommandGroup();
		const sub: string | null = interaction.options.getSubcommand();

		if (group === "blacklist") {
			if (sub === "add") {
				await blacklistAdd(interaction);
			} else if (sub === "remove") {
				await blacklistRemove(interaction);
			} else if (sub === "show") {
				await blacklistShow(interaction);
			}
		} else if (group === "statistics") {
			if (sub === "mystats") {
				await statisticsMystats(interaction);
			} else if (sub === "gamestats") {
				await statisticsGamestats(interaction);
			} else if (sub === "allstats") {
				await statisticsAllstats(interaction);
			}
		} else if (group === "admin") {
			if (!hasAdminPerms(interaction)) {
				return;
			} else if (sub === "reset") {
				await adminReset(interaction);
			} else if (sub === "blacklistgame") {
				await adminBlacklistgame(interaction);
			} else if (sub === "whitelistgame") {
				await adminWhitelistgame(interaction);
			} else if (sub === "look") {
				await adminLook(interaction);
			} else if (sub == "show") {
				await adminShow(interaction);
			}
		} else if (sub == "list") {
			await list(interaction);
		} else if (sub === "disabled") {
			await interaction.reply({
				content:
					"Activity Logging is Disabled for this bot.\nIf it gets activated again you can find more commands which start with `/game-activity-tracker`",
				ephemeral: true,
			});
		}
	}

	register():
		| SlashCommandBuilder
		| SlashCommandSubcommandsOnlyBuilder
		| Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand"> {
		if (!config.logActivity) {
			return new SlashCommandBuilder()
				.setName("game-activity-tracker")
				.setDescription("Tracking is disabled")
				.addSubcommand((sub) => sub.setName("disabled").setDescription("Tracking is disabled"));
		}
		return new SlashCommandBuilder()
			.setName("game-activity-tracker")
			.setDescription("All commands associated with the Game activity tracker!")
			.addSubcommandGroup((group) =>
				group
					.setName("blacklist")
					.setDescription("Manage your blacklist - if a game is on blacklist no activity will be tracked")
					.addSubcommand((sub) =>
						sub
							.setName("add")
							.setDescription("Add a game to your blacklist")
							.addStringOption((opt) =>
								opt
									.setName("game")
									.setDescription("Enter game here - (Capitalization doesnt matter)")
									.setAutocomplete(true)
									.setRequired(true)
							)
					)
					.addSubcommand((sub) =>
						sub
							.setName("remove")
							.setDescription("Remove a game from your blacklist")
							.addStringOption((opt) =>
								opt
									.setName("game")
									.setDescription("Enter game here - (Capitalization doesnt matter)")
									.setAutocomplete(true)
									.setRequired(true)
							)
					)
					.addSubcommand((sub) => sub.setName("show").setDescription("See what is on your blacklist"))
			)
			.addSubcommandGroup((group) =>
				group
					.setName("statistics")
					.setDescription("Statistics")
					.addSubcommand((sub) =>
						sub
							.setName("mystats")
							.setDescription("Show statistics about your own logs")
							.addStringOption((opt) =>
								opt.setName("game").setDescription("Filter stats for the given name").setAutocomplete(true)
							)
					)
					.addSubcommand((sub) =>
						sub
							.setName("gamestats")
							.setDescription("Show statistics about a given game across all logs")
							.addStringOption((opt) =>
								opt
									.setName("game")
									.setDescription("Filter stats for the given game")
									.setAutocomplete(true)
									.setRequired(true)
							)
					)
					.addSubcommand((sub) => sub.setName("allstats").setDescription("Show statistics across all logs"))
			)
			.addSubcommandGroup((group) =>
				group
					.setName("admin")
					.setDescription("Commands which only users with admin permissions can use")
					.addSubcommand((sub) =>
						sub
							.setName("reset")
							.setDescription("Reset every log and blacklist entry")
							.addBooleanOption((opt) =>
								opt.setName("sure").setDescription("Are you really sure?").setRequired(true)
							)
							.addStringOption((opt) =>
								opt
									.setName("really")
									.setDescription("Are you really sure you want to delete every entry?")
									.addChoices(
										{ name: "No. I dont want to delete every log and blacklist entry!", value: "no" },
										{ name: "Yes I am sure. I want to delete every log and blacklist entry!", value: "yes" }
									)
									.setRequired(true)
							)
					)
					.addSubcommand((sub) =>
						sub
							.setName("blacklistgame")
							.setDescription("Add a game on the global blacklist - dont log anything for this game")
							.addStringOption((opt) =>
								opt
									.setName("game")
									.setDescription("Enter game which should get blacklisted. (Capitalization doesnt matter)")
									.setRequired(true)
									.setAutocomplete(true)
							)
					)
					.addSubcommand((sub) =>
						sub
							.setName("whitelistgame")
							.setDescription("Remove a game from the global blacklist - log this game again")
							.addStringOption((opt) =>
								opt
									.setName("game")
									.setDescription(
										"Enter game which should get removed from the blacklisted . (Capitalization doesnt matter)"
									)
									.setRequired(true)
									.setAutocomplete(true)
							)
					)
					.addSubcommand((sub) =>
						sub
							.setName("look")
							.setDescription("See which games a given user have on their blacklist")
							.addUserOption((opt) =>
								opt.setName("user").setDescription("Take a look into this users blacklist").setRequired(true)
							)
					)
					.addSubcommand((sub) => sub.setName("show").setDescription("Show global blacklist"))
			)
			.addSubcommand((sub) =>
				sub
					.setName("list")
					.setDescription("Returns a list of top 10 played games")
					.addStringOption((opt) =>
						opt
							.setName("filter")
							.setDescription("Filted for ...")
							.addChoices(
								{ name: "max -> min -- Playtime", value: "0" },
								{ name: "max <- min -- Playtime", value: "1" },
								{ name: "max -> min -- Amount of Logs", value: "2" },
								{ name: "max <- min -- Amount of Logs", value: "3" },
								{ name: "Last Played", value: "4" },
								{ name: "First Played", value: "5" }
							)
							.setRequired(true)
					)
			);
	}
}

export default new TrackerCommand();
