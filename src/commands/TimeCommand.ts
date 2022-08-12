import { Command } from "../Command";
import { CommandInteraction, TextBasedChannel } from "discord.js";
import {
	SlashCommandBooleanOption,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
	SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import { timeDb } from "../db";

class Reminder extends Command {
	constructor() {
		super("reminder");
	}

	private m_id = 0;

	async elapse(interaction: CommandInteraction, caller: string, message = "", id: number): Promise<void> {
		const ch = (await interaction.client.channels.fetch(interaction.channelId)) as TextBasedChannel;
		if (message != "") {
			await ch.send({
				content: `${caller == "-1" ? "@everyone" : `<@${caller}>`}, Time's up! Message: ${message}`,
			});
		} else {
			await ch.send({
				content: `${caller == "-1" ? "@everyone" : `<@${caller}>`}, Time's up!`,
			});
		}
	}

	async execute(interaction: CommandInteraction): Promise<void> {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "set": {
				//variables
				const second = interaction.options.getInteger("second") || 0;
				let minute = interaction.options.getInteger("minute") || 0;
				const hour = interaction.options.getInteger("hour") || 0;
				const message = interaction.options.getString("message") || "";
				const callAll = interaction.options.getBoolean("callall") || false;
				if (second == 0 && minute == 0 && hour == 0) {
					minute = 10;
				}
				const millisecond = (second + 60 * minute + 60 * 60 * hour) * 1000;
				const d = Date.now() + millisecond;
				if (!interaction.guild) {
					await interaction.reply("This command can only be used inside a guild.");
					return;
				}
				const member = await interaction.guild.members.fetch(interaction.user);
				let i = interaction.user.id;
				if (callAll) {
					if (!member.permissions.has("MENTION_EVERYONE")) {
						await interaction.reply("You don't have the permission, sorry~");
						return;
					}
					i = (-1).toString();
				}
				//call setTimeout
				timeDb.set(this.m_id, {
					timeout: setTimeout(() => this.elapse(interaction, i, message, this.m_id), millisecond),
					destination: d,
					message: message,
					caller_id: member.id,
					notify_all: callAll,
				});
				await interaction.reply(
					"Okay, I'll remind you soon~\nIn the event that you wish to no longer be reminded of this timer, use /reminder delete " +
						this.m_id.toString()
				);
				this.m_id += 1;
				break;
			}
			case "delete": {
				//variable
				const c_id = interaction.options.getInteger("id") || this.m_id - 1;
				if (!interaction.guild) {
					await interaction.reply("This command can only be used inside a guild.");
					return;
				}
				const member = await interaction.guild.members.fetch(interaction.user);
				//clear the reminder
				const item = timeDb.get(c_id);
				if (!item) {
					await interaction.reply("The id does not exist.");
					return;
				}
				if (member.id != item.caller_id) {
					await interaction.reply(
						"You are not the one who had initiate this timer. \nYou are thus not allowed to delete this timer."
					);
				}
				clearTimeout(item.timeout);
				timeDb.delete(c_id);
				await interaction.reply("I've removed the reminder :))");
				break;
			}
			case "list": {
				if (!interaction.guild) {
					await interaction.reply("This command can only be used inside a guild.");
					return;
				}
				const member = await interaction.guild.members.fetch(interaction.user);
				let output = "";
				let have = false;
				timeDb.forEach((value, key) => {
					let t = value.destination;
					if (t >= Date.now() && (value.caller_id == member.id || value.notify_all)) {
						t /= 1000;
						const st = t.toFixed(0).toString();
						output = output + 
						`ID = ${key.toString()} | Time left = <t:${st}:R>` + 
						(value.message == "" ? `` : ` | Message: ${value.message}`) + 
						`\n`; 
						have = true;
					} else {
						if (t < Date.now()) {
							console.log("deleted for whatever reason");
							timeDb.delete(key);
						}
					}
				});
				if (!have) {
					await interaction.reply("The list is empty.");
				} else {
					await interaction.reply(output);
				}
				break;
			}
		}
	}

	register(): SlashCommandSubcommandsOnlyBuilder {
		return new SlashCommandBuilder()
			.setName("reminder")
			.setDescription("Reminds you (in specifically) after a certain amount of time has passed.")
			.addSubcommand((option) =>
				option
					.setName("set")
					.setDescription("Set a new reminder.")
					.addIntegerOption(setSecond)
					.addIntegerOption(setMinute)
					.addIntegerOption(setHour)
					.addStringOption(message)
					.addBooleanOption(callAll)
			)
			.addSubcommand((option) =>
				option
					.setName("delete")
					.setDescription("Delete a reminder (with id).")
					.addIntegerOption((option) => option.setName("id").setDescription("ID of the reminder").setRequired(true))
			)
			.addSubcommand((option) =>
				option.setName("list").setDescription("Show the current list of available reminders.")
			);
	}
}

const setSecond = new SlashCommandIntegerOption()
	.setName("second")
	.setDescription("Set for how many seconds (required field)")
	.setRequired(false);

const setMinute = new SlashCommandIntegerOption()
	.setName("minute")
	.setDescription("Set for how many minutes")
	.setRequired(false);

const setHour = new SlashCommandIntegerOption()
	.setName("hour")
	.setDescription("Set for how many hour")
	.setRequired(false);

const callAll = new SlashCommandBooleanOption()
	.setName("callall")
	.setDescription("Whether or not to remind everyone")
	.setRequired(false);

const message = new SlashCommandStringOption()
	.setName("message")
	.setDescription("The reminder's message")
	.setRequired(false);

export default new Reminder();
