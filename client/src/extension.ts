import * as vscode from 'vscode';
import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-node';
import * as http from 'http';
import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto'; // To generate PKCE challenge

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('.env file loaded successfully:', result.parsed);
}

// Validate required environment variables
const clientId = process.env.CLIENT_ID;
const authority = process.env.AUTHORITY;
const redirectUri = 'http://localhost:3000';

if (!clientId || !authority) {
    throw new Error('Environment variables CLIENT_ID and AUTHORITY must be set.');
}

// MSAL configuration
const msalConfig: Configuration = {
    auth: {
        clientId: clientId!,
        authority: authority!,
    },
};
console.log('MSAL Configuration:', msalConfig);
const pca = new PublicClientApplication(msalConfig);

// Helper function to generate PKCE code verifier and code challenge
function generatePkceCodes(): { verifier: string; challenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    return { verifier: codeVerifier, challenge: codeChallenge };
}

// PKCE values
let codeVerifier: string;

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated');

    // Register the login command
    const loginCommand = vscode.commands.registerCommand('extension.login', async () => {
        console.log('Login command triggered');

        // Generate PKCE values
        const pkce = generatePkceCodes();
        codeVerifier = pkce.verifier; // Save the verifier for token exchange
        console.log('PKCE Code Verifier:', codeVerifier);
        console.log('PKCE Code Challenge:', pkce.challenge);

        const authCodeUrlParameters = {
            scopes: ['openid', 'profile', 'User.Read'],
            redirectUri: redirectUri,
            codeChallenge: pkce.challenge,
            codeChallengeMethod: 'S256',
        };

        try {
            // Generate the authorization URL
            const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
            console.log('Auth URL:', authUrl);
            vscode.env.openExternal(vscode.Uri.parse(authUrl));

            // Listen for the callback and acquire the token
            const token = await listenForCallback();
            console.log('Access token received:', token);

            // Store the token securely in globalState
            context.globalState.update('accessToken', token);
            vscode.window.showInformationMessage('Login successful!');
        } catch (error) {
            console.error('Login failed:', error);
            vscode.window.showErrorMessage(`Login failed: ${(error as Error).message}`);
        }
    });

    context.subscriptions.push(loginCommand);
}

async function listenForCallback(): Promise<string> {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            console.log('Request received at:', req.url);

            if (req.url && (req.url?.startsWith('/') && req.url.includes('code=') || req.url === '/' || req.url.includes('/callback'))) {
                try {
                    const queryParams = new URL(req.url, redirectUri).searchParams;
                    console.log('Query Parameters:', queryParams.toString());

                    const authCode = queryParams.get('code');
                    console.log('Authorization Code:', authCode);

                    if (!authCode) {
                        const errorMsg = 'Authorization code is missing from the callback URL.';
                        console.error(errorMsg);
                        res.end(errorMsg);
                        return reject(new Error(errorMsg));
                    }

                    // Exchange the authorization code for tokens
                    const tokenResponse: AuthenticationResult = await pca.acquireTokenByCode({
                        code: authCode,
                        scopes: ['openid', 'profile', 'User.Read'],
                        redirectUri: redirectUri,
                        codeVerifier: codeVerifier, // Include the PKCE code verifier
                    });
                    console.log('Token Response:', tokenResponse);

                    res.end('Login successful! You can close this page.');
                    server.close();
                    resolve(tokenResponse.accessToken!);
                } catch (error) {
                    console.error('Error acquiring token:', error);
                    res.end('Error acquiring token');
                    server.close();
                    reject(error);
                }
            } else {
                console.warn('Unexpected request received:', req.url);
                res.end('Invalid request');
            }
        });

        server.listen(3000, () => console.log(`Listening on ${redirectUri}`));
    });
}

export function deactivate() {
    console.log('Extension deactivated');
}
