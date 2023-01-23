import {
	App,
	MarkdownPostProcessorContext,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { extractSchedule, readFile, updateScheduleInFile } from "./helpers";
import { FuzzyTagSelectionModal } from "./FuzzyTagSelectionModal";
import { yattpCodeBlockProcessor } from "./codeBlockProcessor";

interface YattpPluginSettings {
	trackingFilePath: string;
}

const DEFAULT_SETTINGS: YattpPluginSettings = {
	trackingFilePath: "tracking.md",
};

export type TrackerData = Array<{ tag: string; date: string }>;

export default class YattpPlugin extends Plugin {
	settings: YattpPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"calendar-clock",
			"Create new tracking entry",
			this.openModal()
		);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "yattp-track-time",
			name: "Track time",
			callback: this.openModal(),
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new YattpSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor(
			"yattp",
			(
				source: string,
				el: HTMLElement,
				ctx: MarkdownPostProcessorContext
			) =>
				yattpCodeBlockProcessor(source, el, ctx, (text: string) =>
					navigator.clipboard.writeText(text)
				)
		);
	}

	private async addTag(tag: string) {
		const filePath = this.settings.trackingFilePath;
		const vault = this.app.vault;
		try {
			const { fileContent } = await readFile(filePath, vault);

			const storedSchedule: TrackerData =
				extractSchedule(fileContent) ?? [];

			storedSchedule.push({ tag, date: new Date().toISOString() });

			await updateScheduleInFile(storedSchedule, filePath, vault);
			new Notice("Added tag!");
		} catch (e) {
			new Notice(e.message);
		}
	}

	private async getExistingTags(): Promise<string[]> {
		const filePath = this.settings.trackingFilePath;
		const vault = this.app.vault;
		try {
			const { fileContent } = await readFile(filePath, vault);

			const storedSchedule: TrackerData =
				extractSchedule(fileContent) ?? [];
			const tagSet = new Set(
				storedSchedule.map(
					(storedScheduleEntry) => storedScheduleEntry.tag
				)
			);
			return Array.from(tagSet);
		} catch (e) {
			new Notice(e.message);
			return [];
		}
	}

	private openModal() {
		return async () => {
			const tags = await this.getExistingTags();
			const modal = new FuzzyTagSelectionModal(this.app, tags, (tag) =>
				this.addTag(tag)
			);
			modal.open();
		};
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class YattpSettingTab extends PluginSettingTab {
	plugin: YattpPlugin;

	constructor(app: App, plugin: YattpPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Settings for Yet Another Time Tracking Plugin.",
		});

		new Setting(containerEl)
			.setName("File path to store schedule")
			.setDesc(
				"The file path to the file where to save the schedule. Must be be a .md file"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.trackingFilePath)
					.onChange(async (value) => {
						this.plugin.settings.trackingFilePath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
