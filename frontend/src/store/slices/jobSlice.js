import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? "https://next-hire-an-online-job-portal-37t9.vercel.app" 
    : "http://localhost:4000",
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - check if backend server is running');
    }
    return Promise.reject(error);
  }
);

const jobSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [],
    loading: false,
    error: null,
    message: null,
    singleJob: {},
    myJobs: [],
  },
  reducers: {
    requestForAllJobs(state, action) {
      state.loading = true;
      state.error = null;
    },
    successForAllJobs(state, action) {
      state.loading = false;
      state.jobs = action.payload;
      state.error = null;
    },
    failureForAllJobs(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    requestForSingleJob(state, action) {
      state.message = null;
      state.error = null;
      state.loading = true;
    },
    successForSingleJob(state, action) {
      state.loading = false;
      state.error = null;
      state.singleJob = action.payload;
    },
    failureForSingleJob(state, action) {
      state.singleJob = state.singleJob;
      state.error = action.payload;
      state.loading = false;
    },
    requestForPostJob(state, action) {
      state.message = null;
      state.error = null;
      state.loading = true;
    },
    successForPostJob(state, action) {
      state.message = action.payload;
      state.error = null;
      state.loading = false;
    },
    failureForPostJob(state, action) {
      state.message = null;
      state.error = action.payload;
      state.loading = false;
    },
    requestForDeleteJob(state, action) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    successForDeleteJob(state, action) {
      state.loading = false;
      state.error = null;
      state.message = action.payload;
    },
    failureForDeleteJob(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    requestForMyJobs(state, action) {
      state.loading = true;
      state.myJobs = [];
      state.error = null;
    },
    successForMyJobs(state, action) {
      state.loading = false;
      state.myJobs = action.payload;
      state.error = null;
    },
    failureForMyJobs(state, action) {
      state.loading = false;
      state.myJobs = state.myJobs;
      state.error = action.payload;
    },
    clearAllErrors(state, action) {
      state.error = null;
      state.jobs = state.jobs;
    },
    resetJobSlice(state, action) {
      state.error = null;
      state.jobs = state.jobs;
      state.loading = false;
      state.message = null;
      state.myJobs = state.myJobs;
      state.singleJob = {};
    },
  },
});

// Helper function to check server connectivity
const checkServerConnection = async () => {
  try {
    console.log('Checking server connection...');
    const response = await api.get('/health');
    console.log('Server is running:', response.status);
    return true;
  } catch (error) {
    console.error('Server connection failed:', error.message);
    return false;
  }
};

export const fetchJobs =
  (city, niche, searchKeyword = "") =>
  async (dispatch) => {
    try {
      dispatch(jobSlice.actions.requestForAllJobs());
      
      // Check server connection first
      const isServerUp = await checkServerConnection();
      if (!isServerUp) {
        throw new Error('Backend server is not responding. Please check if the server is running on the correct port.');
      }
      
      let url = `/api/v1/job/getall`;
      let queryParams = [];

      // Add search keyword if provided
      if (searchKeyword && searchKeyword.trim()) {
        queryParams.push(`searchKeyword=${encodeURIComponent(searchKeyword.trim())}`);
      }

      // Add city filter (only if not "All" and not empty)
      if (city && city !== "All" && city.trim()) {
        queryParams.push(`city=${encodeURIComponent(city)}`);
      }

      // Add niche filter (only if not "All" and not empty)
      if (niche && niche !== "All" && niche.trim()) {
        queryParams.push(`niche=${encodeURIComponent(niche)}`);
      }

      // Append query parameters if any exist
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      console.log("Fetching jobs from:", url);

      const response = await api.get(url);
      
      // Handle successful response
      if (response.data && response.data.jobs) {
        dispatch(jobSlice.actions.successForAllJobs(response.data.jobs));
      } else {
        dispatch(jobSlice.actions.successForAllJobs([]));
      }
      
      dispatch(jobSlice.actions.clearAllErrors());
    } catch (error) {
      console.error("Error fetching jobs:", error);
      
      let errorMessage = "Failed to fetch jobs";
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to server. Please check if the backend server is running on port 4000.";
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "Network error - unable to connect to server";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }
      
      dispatch(jobSlice.actions.failureForAllJobs(errorMessage));
    }
  };

export const fetchSingleJob = (jobId) => async (dispatch) => {
  dispatch(jobSlice.actions.requestForSingleJob());
  try {
    const response = await api.get(`/api/v1/job/get/${jobId}`);
    dispatch(jobSlice.actions.successForSingleJob(response.data.job));
    dispatch(jobSlice.actions.clearAllErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Failed to fetch job details";
    dispatch(jobSlice.actions.failureForSingleJob(errorMessage));
  }
};

export const postJob = (data) => async (dispatch) => {
  dispatch(jobSlice.actions.requestForPostJob());
  try {
    const response = await api.post(`/api/v1/job/post`, data);
    dispatch(jobSlice.actions.successForPostJob(response.data.message));
    dispatch(jobSlice.actions.clearAllErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Failed to post job";
    dispatch(jobSlice.actions.failureForPostJob(errorMessage));
  }
};

export const getMyJobs = () => async (dispatch) => {
  dispatch(jobSlice.actions.requestForMyJobs());
  try {
    const response = await api.get(`/api/v1/job/getmyjobs`);
    dispatch(jobSlice.actions.successForMyJobs(response.data.myJobs));
    dispatch(jobSlice.actions.clearAllErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Failed to fetch your jobs";
    dispatch(jobSlice.actions.failureForMyJobs(errorMessage));
  }
};

export const deleteJob = (id) => async (dispatch) => {
  dispatch(jobSlice.actions.requestForDeleteJob());
  try {
    const response = await api.delete(`/api/v1/job/delete/${id}`);
    dispatch(jobSlice.actions.successForDeleteJob(response.data.message));
    dispatch(clearAllJobErrors());
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Failed to delete job";
    dispatch(jobSlice.actions.failureForDeleteJob(errorMessage));
  }
};

export const clearAllJobErrors = () => (dispatch) => {
  dispatch(jobSlice.actions.clearAllErrors());
};

export const resetJobSlice = () => (dispatch) => {
  dispatch(jobSlice.actions.resetJobSlice());
};

export default jobSlice.reducer;
