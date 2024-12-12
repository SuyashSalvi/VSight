import * as vscode from 'vscode';
import WebSocket from 'ws'; // Import the WebSocket type from the `ws` library

export function activate(context: vscode.ExtensionContext) {
    let ws: WebSocket | null = null;
    const messageQueue: string[] = [];
    let statusBarItem: vscode.StatusBarItem;

    // Function to initialize the WebSocket connection
    function initializeWebSocket() {
        ws = new WebSocket('ws://localhost:3000'); // Connect to WebSocket server

        ws.onopen = () => {
            console.log('WebSocket connection established');
            updateStatusBar('$(check) Connected', 'WebSocket is connected');
            // Send any queued messages
            if (ws) {
                while (messageQueue.length > 0) {
                    ws.send(messageQueue.shift()!);
                }
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data.toString());
                if (data.type === 'updateDocument') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.edit((editBuilder) => {
                            const document = editor.document;
                            const fullRange = new vscode.Range(
                                document.positionAt(0),
                                document.positionAt(document.getText().length)
                            );
                            editBuilder.replace(fullRange, data.content);
                        });
                    }
                } else if (data.type === 'conflictDetected') {
                    vscode.window.showErrorMessage(`Conflict detected: ${data.details}`);
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.edit((editBuilder) => {
                            const document = editor.document;
                            const fullRange = new vscode.Range(
                                document.positionAt(0),
                                document.positionAt(document.getText().length)
                            );
                            editBuilder.replace(fullRange, data.currentContent);
                        });
                    }
                } else {
                    console.warn('Unexpected data type:', data.type);
                }
            } catch (error) {
                console.error('Failed to process WebSocket message:', error);
            }
        };
        

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateStatusBar('$(warning) Error', 'WebSocket error occurred');
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed. Reconnecting...');
            updateStatusBar('$(issue-opened) Reconnecting...', 'WebSocket is reconnecting');
            setTimeout(() => initializeWebSocket(), 1000); // Attempt to reconnect after 1 second
        };
    }

    // Function to update the Status Bar
    function updateStatusBar(text: string, tooltip: string) {
        if (!statusBarItem) {
            statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            context.subscriptions.push(statusBarItem);
        }
        statusBarItem.text = text;
        statusBarItem.tooltip = tooltip;
        statusBarItem.show();
    }

    // Command to send edits to the server
    const sendEditCommand = vscode.commands.registerCommand('collaborative.sendEdit', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
    
        const content = editor.document.getText();
        const message = JSON.stringify({
            type: 'edit',
            userId: '123', // Replace with dynamic user ID
            content: content,
            timestamp: new Date().toISOString(), // Add timestamp for conflict detection
        });
    
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
            vscode.window.showInformationMessage('Edits sent successfully!');
        } else if (ws && ws.readyState === WebSocket.CONNECTING) {
            messageQueue.push(message); // Queue the message for later
            vscode.window.showWarningMessage('WebSocket is connecting. Your edit will be sent when ready.');
        } else {
            vscode.window.showErrorMessage('WebSocket connection is closed. Please restart the extension.');
        }
    });
    

    // Activate the WebSocket connection
    initializeWebSocket();

    // Update Status Bar on activation
    updateStatusBar('$(sync) Connecting...', 'WebSocket is connecting to the server');

    // Register commands
    context.subscriptions.push(sendEditCommand);
}

export function deactivate() {
    console.log('Extension is deactivated.');
}
