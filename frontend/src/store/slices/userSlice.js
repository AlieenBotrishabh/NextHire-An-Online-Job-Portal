import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Create axios instance for user operations
const userApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? "https://next-hire-an-online-job-portal-37t9-8ed6ys7gf.vercel.app" 
    : "http://localhost:4000",
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor
userApi.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
userApi.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    isAuthenticated: false,
    user: {},
    error: null,
    message: null,
  },
  reducers: {
    registerRequest(state, action) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    registerSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      state.message = action.payload.message;
    },
    registerFailed(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
      state.error = action.payload;
      state.message = null;
    },
    loginRequest(state, action) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      state.message = action.payload.message;
    },
    loginFailed(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
      state.error = action.payload;
      state.message = null;
    },
    fetchUserRequest(state, action) {
      state.loading = true;
      state.error = null;
    },
    fetchUserSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    fetchUserFailed(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
      state.error = action.payload;
    },
    logoutRequest(state, action) {
      state.loading = true;
    },
    logoutSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = {};
      state.error = null;
      state.message = action.payload;
    },
    logoutFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    clearAllErrors(state, action) {
      state.error = null;
    },
  },
});

export const register = (data) => async (dispatch) => {
  dispatch(userSlice.actions.registerRequest());
  try {
    const response = await userApi.post("/api/v1/user/register", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(userSlice.actions.registerSuccess(response.data));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Registration failed";
    dispatch(userSlice.actions.registerFailed(errorMessage));
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(userSlice.actions.loginRequest());
  try {
    const response = await userApi.post("/api/v1/user/login", data);
    dispatch(userSlice.actions.loginSuccess(response.data));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Login failed";
    dispatch(userSlice.actions.loginFailed(errorMessage));
  }
};

export const getUser = () => async (dispatch) => {
  dispatch(userSlice.actions.fetchUserRequest());
  try {
    const response = await userApi.get("/api/v1/user/getuser");
    
    if (response && response.data && response.data.user) {
      dispatch(userSlice.actions.fetchUserSuccess(response.data.user));
      dispatch(userSlice.actions.clearAllErrors());
    } else {
      throw new Error("Invalid response format");
    }
    
  } catch (error) {
    console.error("Error fetching user:", error);
    
    let errorMessage = "Failed to fetch user data";
    
    // Handle different types of errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      errorMessage = "Cannot connect to server. Please check if the backend server is running.";
    } else if (error.response) {
      const status = error.response.status;
      if (status === 400 || status === 401) {
        // Authentication error - user is not logged in or token is invalid
        errorMessage = "Please log in to continue";
      } else if (status === 403) {
        errorMessage = "Access forbidden";
      } else if (status === 404) {
        errorMessage = "User not found";
      } else {
        errorMessage = error.response.data?.message || `Server error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = "Network error - unable to connect to server";
    } else {
      errorMessage = error.message || "An unexpected error occurred";
    }
    
    dispatch(userSlice.actions.fetchUserFailed(errorMessage));
  }
};

export const logout = () => async (dispatch) => {
  dispatch(userSlice.actions.logoutRequest());
  try {
    const response = await userApi.get("/api/v1/user/logout");
    dispatch(userSlice.actions.logoutSuccess(response.data.message));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Logout failed";
    dispatch(userSlice.actions.logoutFailed(errorMessage));
  }
};

export const clearAllUserErrors = () => (dispatch) => {
  dispatch(userSlice.actions.clearAllErrors());
};

export default userSlice.reducer;