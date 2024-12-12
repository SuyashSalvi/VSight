import * as vscode from 'vscode';
import { logActivityToApi } from './apiClient';

//const fileLocChanges: Map<string, number> = new Map();
const fileSaveFrequency: Map<string, number> = new Map();
const fileLocChanges: Map<string, number> = new Map();

let userId: string | undefined;

// Function to count lines in a string
const countLines = (text: string): number => {
    return text.split(/\r\n|\r|\n/).length;
};

// Set the user ID (to be called after login)
export const setUserId = (id: string) => {
    userId = id;
};

//Event Listener: Track text changes
export const handleTextChange = vscode.workspace.onDidChangeTextDocument((event) => {
    const document = event.document;
    const fileName = document.fileName;

    // Initialize LOC change count for this file if not already present
    if (!fileLocChanges.has(fileName)) {
        fileLocChanges.set(fileName, 0);
    }

    // Process each content change
    event.contentChanges.forEach((change) => {
        const addedLines = countLines(change.text) - 1; // Count added lines
        const removedLines = countLines(change.rangeLength > 0 ? change.range.toString() : '') - 1; // Count removed lines
        const netChange = addedLines - removedLines;

        // Update LOC change count
        const currentChange = fileLocChanges.get(fileName) || 0;
        fileLocChanges.set(fileName, currentChange + netChange);

        console.log(`File: ${fileName}, Net LOC Change: ${fileLocChanges.get(fileName)}`);
    });
});

// Event Listener: Track and send save frequency and LOC data
export const handleFileSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const fileName = document.fileName;

    // Update save frequency
    const currentSaveCount = fileSaveFrequency.get(fileName) || 0;
    fileSaveFrequency.set(fileName, currentSaveCount + 1);

    // Get LOC changes for the file
    const netLocChange = fileLocChanges.get(fileName) || 0;

    const activity = {
        timestamp: new Date().toISOString(),
        command: 'onDidSaveTextDocument',
        user: userId || 'unknown-user', // Fallback if user ID is not set
        fileName: fileName,
        saveCount: fileSaveFrequency.get(fileName), // Total saves for this file
        locAdded: netLocChange, // Net LOC change for this file
    };

    try {
        // Use the API client to send activity
        await logActivityToApi(activity);

        console.log(`Save frequency and LOC data for '${fileName}' sent to server.`);

        // Reset LOC changes for the file after successful save
        fileLocChanges.set(fileName, 0);
    } catch (error) {
        console.error(`Error logging activity for '${fileName}':`, error);
    }
});


