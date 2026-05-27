import { App, requestUrl, Vault, } from 'obsidian';
import { CatalogSnippet, SnippetsPluginSettings, SnippetWithStatus } from '../types';
import { basename, getSnippetsDir } from 'utils/path-helper';

export class SnippetsService {
    private vault: Vault;
    private snippetsFolderPath: string | null;

    constructor(app: App) {
        this.vault = app.vault;
        this.snippetsFolderPath = getSnippetsDir(this.vault);
    }

    async getInstalledSnippets(): Promise<string[]> {
        if (this.snippetsFolderPath == null) {
            throw new Error('Could not determine vault path');
        }

        const snippets: string[] = [];

        try {
            const list = await this.vault.adapter.list(this.snippetsFolderPath)
            for (const file of list.files) {
                if (!file.endsWith('.css')) {
                    continue;
                }

                const name = basename(file);
                if (name) {
                    snippets.push(name);
                }
            }
        } catch (error) {
            console.error('Failed to check installed snippets:', error);
        }

        return snippets;
    }

    async compareWithCatalog(
        catalog: CatalogSnippet[]
    ): Promise<SnippetWithStatus[]> {
        const installed = await this.getInstalledSnippets();

        return catalog.map((snippet) => ({
            ...snippet,
            installed: installed.includes(`${snippet.name}.css`),
        }));
    }

    async removeSnippet(snippet: CatalogSnippet): Promise<void> {
        if (this.snippetsFolderPath == null) {
            return;
        }
        const cssFileName = `${snippet.name}.css`;
        const snippetPath = `${this.snippetsFolderPath}/${cssFileName}`;

        try {
            if (!(await this.vault.adapter.exists(snippetPath))) {
                return;
            }

            await this.vault.adapter.remove(snippetPath);
        } catch (error) {
            console.error('Failed to remove snippet:', error);
            throw new Error(`Failed to remove snippet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async ensureSnippetsFolderExists(): Promise<void> {
        if (this.snippetsFolderPath == null) {
            return;
        }

        await this.vault.adapter.mkdir(this.snippetsFolderPath);
    }

    async downloadSnippet(snippet: CatalogSnippet, settings: SnippetsPluginSettings): Promise<void> {
        if (this.snippetsFolderPath == null) {
            return;
        }

        const cssFileName = `${snippet.name}.css`;
        const githubUrl = `https://raw.githubusercontent.com/${settings.githubRepository}/${settings.gitBranch}/${snippet.folder}/${cssFileName}`;

        try {
            // Build the GitHub URL: folder/name.css
            await this.ensureSnippetsFolderExists();
            const snippetPath = `${this.snippetsFolderPath}/${cssFileName}`;

            if (await this.vault.adapter.exists(snippetPath)) {
                return
            }

            // Fetch the CSS file
            const response = await requestUrl(githubUrl);
            if (response.status != 200) {
                throw new Error(`Failed to download from GitHub: ${response.status}`);
            }

            const cssContent = response.text;

            // Update existing file
            await this.vault.adapter.write(snippetPath, cssContent);
            // await writeFile(snippetPath, cssContent);
        } catch (error) {
            console.error('Failed to download snippet:', error);
            throw new Error(`Failed to install snippet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
