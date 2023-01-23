import { MarkdownPostProcessorContext } from "obsidian";
import { TrackerData } from "./main";

export function yattpCodeBlockProcessor(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
	copyToClipboard: (text:string)=>void
) {
	const schedule: TrackerData = JSON.parse(source);
	const parsedSchedule = schedule
		.map((entry) => ({
			tag: entry.tag,
			startDate: new Date(entry.date),
		}))
		.sort((a, b) => b.startDate.valueOf() - a.startDate.valueOf())
		.map(({ tag, startDate }, i, arr) => {
			// since the array is in descending order, end date is the previous element start date.
			// For the first element, we consider the endDate as now.
			const endDate = i ? arr[i - 1].startDate : new Date();
			const duration = Math.floor(
				(endDate.valueOf() - startDate.valueOf()) / 1000
			);
			return { tag, startDate, endDate, duration };
		});

	const filterSection = el.createEl("details");
	filterSection.createEl("summary", { text: "Click to view filters" });
	const dateFilter = filterSection.createEl("input", { type: "date" });

	const table = el.createEl("table");
	renderTable(table, parsedSchedule);

	dateFilter.addEventListener("input", (ev: InputEvent) => {
		const selectedDate = new Date((<HTMLInputElement>ev.target).value);
		if (isNaN(selectedDate.getTime()))
		{
			renderTable(table,parsedSchedule);
			return;
		}
		const filteredSchedule = parsedSchedule.filter(
			({ startDate }) =>
				startDate.getFullYear() === selectedDate.getFullYear() &&
				startDate.getMonth() === selectedDate.getMonth() &&
				startDate.getDate() === selectedDate.getDate()
		).sort((a, b) => a.startDate.valueOf()-b.startDate.valueOf());
		renderTable(table,filteredSchedule);
	});
	filterSection
		.createEl("button", { text: "Remove filter" })
		.addEventListener("click", () => {
			dateFilter.value = "";
			renderTable(table, parsedSchedule);
		});

	const exportToCsvButton = el.createEl("button", {
		text: "Export all entries to CSV",
	});
	exportToCsvButton.addEventListener("click", () => {
		const text=parsedSchedule.map(({duration, tag,startDate,endDate})=>`"${tag}","${startDate.toLocaleString()}","${endDate.toLocaleString()}",${duration}`).join("\n");
		copyToClipboard(text);
	});
}

function renderTable(
	table: HTMLTableElement,
	parsedSchedule: {
		duration: number;
		endDate: Date;
		tag: string;
		startDate: Date;
	}[]
) {
	table.replaceChildren();

	const head = table.createEl("thead");
	const headRow = head.createEl("tr");
	headRow.createEl("td", { text: "Tag" });
	headRow.createEl("td", { text: "Date started" });
	headRow.createEl("td", { text: "Duration" });
	const body = table.createEl("tbody");

	for (let i = 0; i < parsedSchedule.length; i++) {
		const row = body.createEl("tr");
		row.createEl("td", { text: parsedSchedule[i].tag });
		row.createEl("td", {
			text: parsedSchedule[i].startDate.toLocaleString(),
		});
		const duration = parsedSchedule[i].duration;
		row.createEl("td", {
			text: `${Math.floor(duration / 3600)}h ${Math.floor(
				(duration % 3600) / 60
			)}m ${Math.floor(duration % 60)}s`,
		});
	}
}
