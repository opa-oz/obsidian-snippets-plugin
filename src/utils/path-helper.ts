import { FileSystemAdapter, Vault } from "obsidian";


export function getVaultRoot(vault: Vault): (string | null) {
    // Get vault root path - use electron/nodejs APIs directly since this is desktop-only
    let vaultPath: string;

    if (vault.adapter instanceof FileSystemAdapter) {
        vaultPath = vault.adapter.getBasePath();
        return vaultPath;
    } else {
        console.error('Failed to get vault path');
        return null
    }
}
export function getConfigDir(vault: Vault): (string | null) {
    return vault.configDir;
}

export function getPluginsDir(vault: Vault): (string | null) {
    const configDir = getConfigDir(vault);
    if (configDir == null) {
        return null
    }

    return `${configDir}/plugins`;
}

export function getSnippetsDir(vault: Vault): (string | null) {
    const configDir = getConfigDir(vault);
    if (configDir == null) {
        return null
    }

    return `${configDir}/snippets`;
}


export function basename(normalizedfilePath: string): string | undefined {
    const parts = normalizedfilePath.split('/');

    if (parts.length == 0) {
        return undefined
    }

    return parts[parts.length - 1];
}
