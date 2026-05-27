import { App, PluginSettingTab, Notice, Setting } from "obsidian";
import SnippetsPlugin from "./main";
import { CatalogService } from "./services/catalogService";
import { SnippetsService } from "./services/snippetsService";
import { SnippetWithStatus, SnippetsPluginSettings } from "./types";
import { callout } from "components/callout";

export const DEFAULT_SETTINGS: SnippetsPluginSettings = {
    githubRepository: 'opa-oz/obsidian-snippets',
    gitBranch: 'main',
    snippetState: new Map()
}

const CSS_CLASSES = {
    settingGroup: 'setting-group',
    settingItems: 'setting-items',
};

export class SnippetsSettingTab extends PluginSettingTab {
    plugin: SnippetsPlugin;
    private snippetsService: SnippetsService;
    private snippets: SnippetWithStatus[];

    constructor(app: App, plugin: SnippetsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.snippetsService = new SnippetsService(app);

        this.refreshSnippets().catch(error => console.error(error));
    }

    async refreshSnippets(): Promise<void> {
        const catalog = await CatalogService.loadCatalog(this.plugin.settings);
        this.plugin.settings.snippetState = new Map();

        // Get installed snippets and compare
        const snippetsWithStatus = await this.snippetsService.compareWithCatalog(catalog);
        snippetsWithStatus.forEach(snippet => {
            this.plugin.settings.snippetState.set(snippet.folder, snippet.installed);
        })
        await this.plugin.saveSettings();

        this.snippets = snippetsWithStatus;
        this.display();
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const staticSettingGroup = containerEl.createDiv({ cls: CSS_CLASSES.settingGroup });
        const settingItems = staticSettingGroup.createDiv({ cls: CSS_CLASSES.settingItems });

        new Setting(settingItems)
            .setName('GitHub repository')
            .setDesc('The GitHub repository to fetch snippets from (format: owner/repo)')
            .addText(text =>
                text
                    // eslint-disable-next-line obsidianmd/ui/sentence-case
                    .setPlaceholder('opa-oz/obsidian-snippets')
                    .setValue(this.plugin.settings.githubRepository)
                    .onChange(async (value) => {
                        this.plugin.settings.githubRepository = value;
                        await this.plugin.saveSettings();
                        CatalogService.clearCache(this.plugin.settings);
                    })
            );
        new Setting(settingItems)
            .setName('Branch')
            .setDesc('Branch to pull snippets from')
            .addText(text =>
                text
                    .setPlaceholder('For example: main')
                    .setValue(this.plugin.settings.gitBranch)
                    .onChange(async (value) => {
                        this.plugin.settings.gitBranch = value;
                        await this.plugin.saveSettings();
                        CatalogService.clearCache(this.plugin.settings);
                    })
            );

        const snippetsGroup = containerEl.createDiv();
        snippetsGroup.addClass(CSS_CLASSES.settingGroup);
        new Setting(snippetsGroup)
            .setName('Available snippets')
            .setHeading()
            .addExtraButton(button => {
                // button.setTooltip('Manually fetch the latest snippets from GitHub');
                button.setIcon("refresh-cw");
                button.onClick(async () => {
                    CatalogService.clearCache(this.plugin.settings);
                    this.display();
                    new Notice('Catalog refreshed!');
                });
            });

        callout(snippetsGroup, {
            type: "tip",
            title: "This is just installation",
            text: ["Do not forget to enable snippets in Settings -> Appearance"]
        });

        const snippetsItems = snippetsGroup.createDiv({ cls: CSS_CLASSES.settingItems });

        try {
            if (this.snippets && this.snippets.length === 0) {
                callout(snippetsGroup, {
                    type: "fail",
                    title: "No snippets available"
                });
                return;
            }

            this.snippets.forEach((snippet) => {
                new Setting(snippetsItems)
                    .setName(snippet.name)
                    .setDesc(`by ${snippet.author}`)
                    .addToggle(toggle => {
                        toggle
                            .setValue(this.plugin.settings.snippetState.get(snippet.folder) || false)
                            .onChange(async (value) => {
                                this.plugin.settings.snippetState.set(snippet.folder, value);

                                if (value) {
                                    await this.handleInstall(snippet);
                                } else {
                                    await this.handleRemove(snippet);
                                }
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });
            });
        } catch (error) {
            console.error('Error displaying snippets:', error);
        }
    }

    private async handleInstall(snippet: SnippetWithStatus): Promise<void> {
        try {
            await this.snippetsService.downloadSnippet(snippet, this.plugin.settings);
            new Notice(`✓ ${snippet.name} installed successfully!`);
        } catch (error) {
            this.plugin.settings.snippetState.set(snippet.folder, false);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`✗ Failed to install ${snippet.name}: ${errorMessage}`);
            console.error('Install error:', error);
        }
    }

    private async handleRemove(snippet: SnippetWithStatus): Promise<void> {
        try {
            await this.snippetsService.removeSnippet(snippet);
            new Notice(`✓ ${snippet.name} removed successfully!`);
        } catch (error) {
            this.plugin.settings.snippetState.set(snippet.folder, true);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`✗ Failed to remove ${snippet.name}: ${errorMessage}`);
            console.error('Remove error:', error);
        }
    }
}
