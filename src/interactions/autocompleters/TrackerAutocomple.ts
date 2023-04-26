import { Autocompleter } from "../interactionClasses";
import { AutocompleteInteraction } from "discord.js";
import { trackerBlacklist, trackerGames, trackerUsers } from "../../db";
import { blacklist, user } from "../../util/tracker/autocompleteHelper";

class Tracker extends Autocompleter {
	constructor() {
		super("tracker");
	}

	async execute(interaction: AutocompleteInteraction): Promise<void> {
		const sub = interaction.options.getSubcommand();
		const focus = interaction.options.getFocused().toLowerCase() as string;
		const option = interaction.options.getFocused(true).name;

		// if user-option is given, use it, else default to executer
		const userId =
			typeof interaction.options.get("user")?.value == "string"
				? interaction.options.get("user")?.value
				: interaction.user.id;
		const game = interaction.options.get("game")?.value;

		// if action-option is given, use it, else default to add
		const action =
			typeof interaction.options.get("action")?.value == "string"
				? interaction.options.get("action")?.value
				: "add";

		// make ts happy...
		if (typeof action != "string") return;

		let options: string[] = [];

		if (sub == "user") {
			options = user(option, userId, game);
		} else if (sub == "game") {
			trackerGames.keyArray().forEach((e) => options.push(e));
		} else if (sub == "blacklist") {
			options = blacklist(action);
		}

		let filteredOptions = options.filter((o) => o.toLowerCase().startsWith(focus));
		filteredOptions = filteredOptions.slice(0, 25);

		await interaction.respond(filteredOptions.map((c) => ({ name: c, value: c })));
	}
}

export default new Tracker();
