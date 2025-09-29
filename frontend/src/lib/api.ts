const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? (() => {
      const url = process.env.NEXT_PUBLIC_API_URL;
      if (!url) {
        throw new Error('NEXT_PUBLIC_API_URL is not set for production');
      }
      return url;
    })()
  : 'http://localhost:8000';

// Types based on backend schemas
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface Review {
  id: number;
  landlord_name: string;
  property_address?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  overall_rating: number;
  is_bookmarked?: boolean;
  maintenance_rating?: number;
  communication_rating?: number;
  respect_rating?: number;
  rent_value_rating?: number;
  would_rent_again?: boolean;
  monthly_rent?: number;
  move_in_date?: string;
  move_out_date?: string;
  is_anonymous: boolean;
  review_text: string;
  created_at: string;
  author_email?: string;
}

export interface ReviewCreate {
  landlord_name: string;
  property_address?: string;
  overall_rating: number;
  maintenance_rating?: number;
  communication_rating?: number;
  respect_rating?: number;
  rent_value_rating?: number;
  would_rent_again?: boolean;
  monthly_rent?: number;
  move_in_date?: string;
  move_out_date?: string;
  is_anonymous: boolean;
  review_text: string;
  contact_email?: string; // optional, not exposed in list responses
}

export interface Bookmark {
  id: number;
  user_id: number;
  review_id: number;
  created_at: string;
  review: Review;
}

export interface BookmarkCreate {
  review_id: number;
}

export interface UserCreate {
  email: string;
  password: string;
}

// Helper functions for token management
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('rml_auth_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem('rml_auth_token', token);
    localStorage.setItem('rml_auth', 'true'); // Keep compatibility with existing code
  } catch { }
};

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem('rml_auth_token');
    localStorage.removeItem('rml_auth');
  } catch { }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Generic API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Ensure proper URL construction without double slashes
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Merge existing headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network error' }));

    // Handle different error formats from FastAPI
    let errorMessage = `HTTP ${response.status}`;
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // Handle FastAPI validation errors
        errorMessage = errorData.detail.map((err: any) =>
          `${err.loc?.join(' -> ') || 'Field'}: ${err.msg || 'Invalid'}`
        ).join(', ');
      } else {
        errorMessage = JSON.stringify(errorData.detail);
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// API functions
export const authAPI = {
  signup: async (userData: UserCreate): Promise<User> => {
    return apiRequest<User>('/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (email: string, password: string): Promise<Token> => {
    const formData = new FormData();
    formData.append('username', email); // FastAPI OAuth2PasswordRequestForm expects 'username'
    formData.append('password', password);

    return apiRequest<Token>('/login', {
      method: 'POST',
      body: formData,
    });
  },
};

export const reviewsAPI = {
  list: async (limit: number = 20): Promise<Review[]> => {
    return apiRequest<Review[]>(`/reviews?limit=${limit}`);
  },

  create: async (reviewData: ReviewCreate): Promise<Review> => {
    return apiRequest<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Get user's own reviews
  myReviews: async (): Promise<Review[]> => {
    return apiRequest<Review[]>('/my-reviews');
  },
};

export const bookmarksAPI = {
  // Get user's bookmarks
  list: async (): Promise<Bookmark[]> => {
    return apiRequest<Bookmark[]>('/bookmarks');
  },

  // Add bookmark
  create: async (reviewId: number): Promise<Bookmark> => {
    return apiRequest<Bookmark>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ review_id: reviewId }),
    });
  },

  // Remove bookmark
  remove: async (reviewId: number): Promise<void> => {
    return apiRequest<void>(`/bookmarks/${reviewId}`, {
      method: 'DELETE',
    });
  },
};
