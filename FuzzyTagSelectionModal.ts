import { App, FuzzyMatch, FuzzySuggestModal, Notice } from "obsidian";

interface Tag {
	tag: string;
	createTagWithString?: string;
}

/**
 * A fuzzy modal that allows adding new tags
 */
export class FuzzyTagSelectionModal extends FuzzySuggestModal<Tag> {
	private readonly reservedCreateTag: Tag = {
		tag: "Create new tag ",
	};

	private readonly tags: Tag[];
	private readonly onSubmit: (tag: string) => void;

	constructor(app: App, tags: string[], onSubmit: (tag: string) => void) {
		super(app);
		this.tags = tags.map((tag) => ({ tag }));
		this.onSubmit = onSubmit;
		super.setInstructions([
			{ command: "", purpose: "Insert the tag to save!" },
		]);
	}

	/**
	 * Manipulate suggestions returned to allow adding new tags when needed
	 * @param query
	 */
	getSuggestions(query: string): FuzzyMatch<Tag>[] {
		const match = super.getSuggestions(query);
		if (query)
			return match.concat(
				{
					item: {
						tag: this.reservedCreateTag.tag + `"${query}"`,
						createTagWithString: query,
					},
					match: { matches: [], score: 0 },
				}
			);
		else return match;
	}

	getItems(): Tag[] {
		return this.tags;
	}

	getItemText(tag: Tag): string {
		return tag.tag;
	}

	onChooseItem(tag: Tag, evt: MouseEvent | KeyboardEvent) {
		if (tag.createTagWithString) {
			this.onSubmit(tag.createTagWithString.trim());
			return;
		}
		// Filter out the empty row between the existing tags and the
		if (!tag.tag.trim()) {
			new Notice("No entry was added!");
			return;
		}
		this.onSubmit(tag.tag);
	}
}
