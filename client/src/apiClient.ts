import axios from 'axios';

const apiServerUrl = process.env.API_SERVER_URL || 'http://localhost:3001';

/**
 * Logs user activity by sending a POST request to the API server.
 * @param activity The activity object to log.
 */
export async function logActivityToApi(activity: Record<string, any>) {
    try {
        console.log('API URL:', apiServerUrl);
        console.log('Activity Payload:', activity);

        const response = await axios.post(`${apiServerUrl}/track-activity`, activity);
        console.log('Activity logged to API:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to log activity to API:', error);
        throw new Error('Failed to log activity to API');
    }
}
