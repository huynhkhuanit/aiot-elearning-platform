import {
    compressToEncodedURIComponent,
    decompressFromEncodedURIComponent,
} from "lz-string";

import type { GridWorkspaceState } from "./gridTypes";
import { normalizeWorkspaceState } from "./gridUtils";

export const GRID_DRAFT_STORAGE_KEY = "css-grid-generator-draft-v1";
const GRID_HASH_PREFIX = "#grid=";

export function serializeGridState(state: GridWorkspaceState) {
    return compressToEncodedURIComponent(JSON.stringify(state));
}

export function deserializeGridState(
    encodedState: string,
    fallback: GridWorkspaceState,
) {
    try {
        const raw = decompressFromEncodedURIComponent(encodedState);
        if (!raw) {
            return null;
        }

        return normalizeWorkspaceState(JSON.parse(raw), fallback);
    } catch {
        return null;
    }
}

export function getGridStateFromHash(
    hash: string,
    fallback: GridWorkspaceState,
) {
    if (!hash.startsWith(GRID_HASH_PREFIX)) {
        return null;
    }

    return deserializeGridState(hash.slice(GRID_HASH_PREFIX.length), fallback);
}

export function buildGridShareHash(state: GridWorkspaceState) {
    return `${GRID_HASH_PREFIX}${serializeGridState(state)}`;
}

export function writeGridDraft(
    storage: Storage,
    state: GridWorkspaceState,
) {
    storage.setItem(GRID_DRAFT_STORAGE_KEY, JSON.stringify(state));
}

export function readGridDraft(
    storage: Storage,
    fallback: GridWorkspaceState,
) {
    const raw = storage.getItem(GRID_DRAFT_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return normalizeWorkspaceState(JSON.parse(raw), fallback);
    } catch {
        return null;
    }
}
