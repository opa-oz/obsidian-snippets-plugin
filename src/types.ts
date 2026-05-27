export interface CatalogSnippet {
    name: string;
    folder: string;
    author: string;
}

export interface SnippetWithStatus extends CatalogSnippet {
    installed: boolean;
    isLoading?: boolean;
}

export interface SnippetsPluginSettings {
    githubRepository: string;
    gitBranch: string;
    snippetState: Map<string, boolean>;
}
