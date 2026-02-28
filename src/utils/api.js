const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Custom fetch wrapper that handles automatic token refresh on 401 errors.
 */
export const apiFetch = async (url, options = {}) => {
    // Ensure credentials: 'include' is always set for cookie handling
    const defaultOptions = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    let response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, defaultOptions);

    // If 401 Unauthorized, try to refresh the token
    if (response.status === 401) {
        console.log('Session expired, attempting refresh...');
        
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (refreshResponse.ok) {
            console.log('Token refreshed successfully, retrying original request...');
            // Retry the original request with the new cookie set
            response = await fetch(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, defaultOptions);
        } else {
            console.warn('Refresh failed, user must log in again.');
            // Optional: Dispatch a custom event or redirect if needed
            // window.dispatchEvent(new CustomEvent('unauthorized'));
        }
    }

    return response;
};
