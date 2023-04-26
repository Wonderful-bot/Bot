import { confirmEmbed, errorEmbed } from "./helper";

/** Used when a user cant be fetched by `interaction.options.getUser("user")` or `interaction.user` */
export const userNotFound = errorEmbed("user not found", "Cant get user option or interaction user.");
/** Used when `interaction.guild.members.get(userID)` does work with given user */
export const memberNotFound = errorEmbed(
	"member not found",
	"Cant get guild member, user may not be on this server anymore."
);
/** Used when a given user is not found in the tracker database */
export const userNoEntry = errorEmbed("no database entry", "Given user has no entries in the database.");
/** Used when a given game is not found in users tracker database entry */
export const userNoGameEntry = errorEmbed(
	"no database entry",
	"Given user has no entrys in the database associated with given the game."
);
//** Used when a given game is not found in the tracker database */
export const gameNoEntry = errorEmbed("no database entry", "Given game has no entry in the database.");
/** Used when a non admin user tryes to use a admin only command */
export const adminOnly = errorEmbed("admin only", "This command can only be executed by an admin.");
/** Used when there is an attempt to add a game to the blacklist while its already on there */
export const gameOnBlacklist = errorEmbed("already on blacklist", "Given game is already on the blacklist.");
/** User when there is an attempt to remove a game from the blacklist whole its not on there */
export const gameNotOnBlacklist = errorEmbed("not on blacklist", "Given game is not on the blacklist.");
/** Used to confirm the adding of a given game to the blacklist */
export const GameAdded = (game: string) => confirmEmbed(`"${game}" has been added to the blacklist!`);
/** Used to confirm the removal of a given game from the blacklist */
export const GameRemoved = (game: string) => confirmEmbed(`"${game}" has been removed from the blacklist!`);
