import { Client, TextChannel } from "discord.js";
import { Duration } from "luxon";
import { jamEventsDb, jamTimeoutCache, pollEventsDb, pollTimeoutCache } from "../../db";
import { logger } from "../../logger";
import { config } from "../../config";
import {
	closeToEndEvent,
	closeToStartEvent,
	createScheduledEventEvent,
	endEvent,
	halftimeEvent,
	startEvent,
} from "./jamEvents";
import { beforeEvent, closeEvent, openEvent } from "./pollEvents";

export async function elapseJamEvent(client: Client, eventID: string, jamID: string): Promise<void> {
	const event = jamEventsDb.get(eventID);
	if (!event) return;

	const channel = (await client.channels.fetch(config.jamChannelId)) as TextChannel;

	const events = {
		start: startEvent,
		end: endEvent,
		createScheduledEvent: createScheduledEventEvent,
		halftime: halftimeEvent,
		"close-to-end": closeToEndEvent,
		"close-to-start": closeToStartEvent,
	};

	events[event.type](channel, jamID);

	jamTimeoutCache.delete(eventID);
}

export async function elapsePollEvent(client: Client, eventID: string, pollID: string): Promise<void> {
	const event = pollEventsDb.get(eventID);
	if (!event) return;

	const channel = (await client.channels.fetch(config.pollChannelId)) as TextChannel;

	const events = {
		open: openEvent,
		close: closeEvent,
		before: beforeEvent,
	};

	events[event.type](channel, pollID);

	pollTimeoutCache.delete(eventID);
}

export function jamSchedulerTick(client: Client) {
	try {
		jamEventsDb.forEach((event, id) => {
			const diffNow = event.date.diffNow();
			if (!jamTimeoutCache.has(id) && diffNow <= Duration.fromObject({ hours: 1 })) {
				jamTimeoutCache.set(
					id,
					setTimeout(() => elapseJamEvent(client, id, event.jamID), diffNow.toMillis())
				);
			}
		});
		pollEventsDb.forEach((event, id) => {
			const diffNow = event.date.diffNow();
			if (!pollTimeoutCache.has(id) && diffNow <= Duration.fromObject({ hours: 1 })) {
				pollTimeoutCache.set(
					id,
					setTimeout(() => elapsePollEvent(client, id, event.pollID), diffNow.toMillis())
				);
			}
		});
	} catch (e) {
		logger.error("Error in coding-jam scheduler tick", e);
	}
}
