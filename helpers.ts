import { Notice, TFile, Vault } from "obsidian";
import { TrackerData } from "./main";

export async function readFile(filePath: string, vault: Vault) {
	const file = vault.getAbstractFileByPath(filePath);
	if (!(file instanceof TFile)) {
		throw new Error("Could not read file " + filePath);
	}
	return { fileContent: await vault.cachedRead(file), file };
}

export function extractSchedule(
	rawFileContent: string
): TrackerData | undefined {
	const matcher = /^```yattp\n(?<json>[\s\S]*?)\n^```$/m;

	const yattpCodeBlockMatch = rawFileContent.match(matcher);
	try {
		if (yattpCodeBlockMatch?.groups) {
			return JSON.parse(yattpCodeBlockMatch.groups.json);
		} else {
			return undefined;
		}
	} catch (e) {
		throw new Error(
			"Could not parse json. Try fixing the json block. Error: " +
				e.message
		);
	}
}

export async function updateScheduleInFile(
	newSchedule: TrackerData,
	filePath: string,
	vault: Vault
) {
	const { fileContent: rawFileContent, file } = await readFile(
		filePath,
		vault
	);

	const newScheduleStr: string =
		"```yattp\n" + JSON.stringify(newSchedule, null, 2) + "\n```";

	const matcher = /^```yattp\n(?<json>[\s\S]*?)\n^```$/m;
	const yattpCodeBlockMatch = rawFileContent.match(matcher);

	let fileContent: string;
	// update existing block if regex matches
	if (yattpCodeBlockMatch?.groups) {
		fileContent = rawFileContent.replace(matcher, newScheduleStr);
	} else {
		new Notice("Appended file because yattp block was not found!");
		fileContent = rawFileContent.concat("\n", newScheduleStr);
	}

	await vault.modify(file, fileContent);
}
