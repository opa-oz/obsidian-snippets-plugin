import { requestUrl } from 'obsidian';
import { CatalogSnippet, SnippetsPluginSettings } from '../types';

export class CatalogService {
    private static cache: Map<string, CatalogSnippet[]> = new Map();
    private static cacheTime: Map<string, number> = new Map();
    private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    static async loadCatalog(settings: SnippetsPluginSettings): Promise<CatalogSnippet[]> {
        // Return cached data if still fresh
        const cacheKey = `${settings.githubRepository}/${settings.gitBranch}`;
        if (this.cache.has(cacheKey) && Date.now() - (this.cacheTime.get(cacheKey) || 0) < this.CACHE_DURATION) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const catalogUrl = `https://raw.githubusercontent.com/${settings.githubRepository}/${settings.gitBranch}/catalog.json`;
            const response = await requestUrl(catalogUrl);
            if (response.status != 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json as CatalogSnippet[];
            this.cache.set(cacheKey, data);
            this.cacheTime.set(cacheKey, Date.now());

            return new Promise<CatalogSnippet[]>(resolve => setTimeout(() => resolve(data), 500))
        } catch (error) {
            console.error('Failed to load catalog:', error);
            throw new Error('Failed to load snippets catalog. Please check your internet connection.');
        }
    }

    static clearCache(settings: SnippetsPluginSettings): void {
        const cacheKey = `${settings.githubRepository}/${settings.gitBranch}`;

        this.cache.delete(cacheKey);
        this.cacheTime.delete(cacheKey);
    }
}
