import { errorHandler } from "./error-handler"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiClientOptions {
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async handleResponse<T>(
    response: Response,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { showErrorToast = true, showSuccessToast = false, successMessage } = options

    try {
      const data: ApiResponse<T> = await response.json()

      if (!response.ok) {
        const error = new Error(data.error || data.message || `HTTP ${response.status}`)
        
        if (showErrorToast) {
          errorHandler.handleApiError(error, {
            title: "Request Failed",
            description: data.error || data.message || "An error occurred"
          })
        }
        
        throw error
      }

      if (!data.success) {
        const error = new Error(data.error || data.message || "Request failed")
        
        if (showErrorToast) {
          errorHandler.handleApiError(error, {
            title: "Request Failed",
            description: data.error || data.message || "An error occurred"
          })
        }
        
        throw error
      }

      if (showSuccessToast && successMessage) {
        errorHandler.showSuccess("Success", successMessage)
      }

      // Ensure we return the data, throw error if undefined
      if (data.data === undefined) {
        throw new Error("No data received from server")
      }

      return data.data
    } catch (error) {
      if (error instanceof SyntaxError) {
        // JSON parsing error
        const parseError = new Error("Invalid response format")
        
        if (showErrorToast) {
          errorHandler.handleApiError(parseError, {
            title: "Response Error",
            description: "Invalid response format from server"
          })
        }
        
        throw parseError
      }
      
      throw error
    }
  }

  async get<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return this.handleResponse<T>(response, options)
    } catch (error) {
      if (!navigator.onLine) {
        errorHandler.handleNetworkError(error, {
          title: "Network Error",
          description: "Please check your internet connection"
        })
      }
      throw error
    }
  }

  async post<T>(url: string, data?: any, options: ApiClientOptions = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      return this.handleResponse<T>(response, options)
    } catch (error) {
      if (!navigator.onLine) {
        errorHandler.handleNetworkError(error, {
          title: "Network Error",
          description: "Please check your internet connection"
        })
      }
      throw error
    }
  }

  async put<T>(url: string, data?: any, options: ApiClientOptions = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      })

      return this.handleResponse<T>(response, options)
    } catch (error) {
      if (!navigator.onLine) {
        errorHandler.handleNetworkError(error, {
          title: "Network Error",
          description: "Please check your internet connection"
        })
      }
      throw error
    }
  }

  async delete<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return this.handleResponse<T>(response, options)
    } catch (error) {
      if (!navigator.onLine) {
        errorHandler.handleNetworkError(error, {
          title: "Network Error",
          description: "Please check your internet connection"
        })
      }
      throw error
    }
  }
}

// Create a default instance
export const apiClient = new ApiClient()

// Helper function for API calls with error handling
export const withApiErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  options: ApiClientOptions = {}
): Promise<T | null> => {
  try {
    return await apiCall()
  } catch (error) {
    if (options.showErrorToast !== false) {
      errorHandler.handleError(error, {
        title: "API Error",
        description: "An error occurred while processing your request"
      })
    }
    return null
  }
}