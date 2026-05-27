import { Plugin } from 'obsidian';
import { SnippetsPluginSettings } from './types';
import { DEFAULT_SETTINGS, SnippetsSettingTab } from "./settings";

export default class SnippetsPlugin extends Plugin {
    settings: SnippetsPluginSettings;

    async onload() {
        await this.loadSettings();

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SnippetsSettingTab(this.app, this));
    }

    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<SnippetsPluginSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
