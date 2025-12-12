import axios from 'axios';
import type { SimplifiedElement } from '../content/domScanner';

const API_BASE_URL = 'http://localhost:8000/api';

export interface TourStep {
    element_selector: string;
    narrative: string;
    action: string;
}

export interface TourPlan {
    steps: TourStep[];
}

export const generateTour = async (pageTitle: string, elements: SimplifiedElement[]): Promise<TourPlan> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/analyze`, {
            url: window.location.href,
            title: pageTitle,
            elements: elements
        });

        // Handle the LangChain result structure
        // If it returns { tool_calls: ... } or just raw JSON, adapt here.
        // Assuming backend returns direct TourPlan object or similar.
        return response.data;
    } catch (error) {
        console.error('Error generating tour:', error);
        throw error;
    }
};

export const sendChatMessage = async (query: string, pageTitle: string, elements: SimplifiedElement[]): Promise<string> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, {
            query: query,
            content: {
                url: window.location.href,
                title: pageTitle,
                elements: elements
            }
        });
        return response.data.response;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};
