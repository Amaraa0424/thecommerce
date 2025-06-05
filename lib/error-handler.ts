import { toast } from "@/hooks/use-toast"

export interface ErrorHandlerOptions {
  title?: string
  description?: string
  showToast?: boolean
  logError?: boolean
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = {
  // Handle API errors
  handleApiError: (error: any, options: ErrorHandlerOptions = {}) => {
    const {
      title = "Error",
      description,
      showToast = true,
      logError = true
    } = options

    if (logError) {
      console.error("API Error:", error)
    }

    let errorMessage = description || "An unexpected error occurred"

    // Extract error message from different error formats
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    if (showToast) {
      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      })
    }

    return errorMessage
  },

  // Handle network errors
  handleNetworkError: (error: any, options: ErrorHandlerOptions = {}) => {
    const {
      title = "Network Error",
      description = "Please check your internet connection and try again",
      showToast = true,
      logError = true
    } = options

    if (logError) {
      console.error("Network Error:", error)
    }

    if (showToast) {
      toast({
        title,
        description,
        variant: "destructive",
      })
    }

    return description
  },

  // Handle validation errors
  handleValidationError: (error: any, options: ErrorHandlerOptions = {}) => {
    const {
      title = "Validation Error",
      showToast = true,
      logError = true
    } = options

    if (logError) {
      console.error("Validation Error:", error)
    }

    let errorMessage = "Please check your input and try again"

    if (error?.errors && Array.isArray(error.errors)) {
      errorMessage = error.errors.map((err: any) => err.message).join(", ")
    } else if (error?.message) {
      errorMessage = error.message
    }

    if (showToast) {
      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      })
    }

    return errorMessage
  },

  // Handle authentication errors
  handleAuthError: (error: any, options: ErrorHandlerOptions = {}) => {
    const {
      title = "Authentication Error",
      description = "Please log in to continue",
      showToast = true,
      logError = true
    } = options

    if (logError) {
      console.error("Auth Error:", error)
    }

    let errorMessage = description

    if (error?.message) {
      errorMessage = error.message
    }

    if (showToast) {
      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      })
    }

    return errorMessage
  },

  // Handle permission errors
  handlePermissionError: (error: any, options: ErrorHandlerOptions = {}) => {
    const {
      title = "Permission Denied",
      description = "You don't have permission to perform this action",
      showToast = true,
      logError = true
    } = options

    if (logError) {
      console.error("Permission Error:", error)
    }

    if (showToast) {
      toast({
        title,
        description,
        variant: "destructive",
      })
    }

    return description
  },

  // Generic error handler
  handleError: (error: any, options: ErrorHandlerOptions = {}) => {
    const {
      title = "Error",
      description,
      showToast = true,
      logError = true
    } = options

    if (logError) {
      console.error("Error:", error)
    }

    // Determine error type and handle accordingly
    if (error?.response?.status === 401) {
      return errorHandler.handleAuthError(error, { ...options, title: title || "Authentication Required" })
    }

    if (error?.response?.status === 403) {
      return errorHandler.handlePermissionError(error, options)
    }

    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return errorHandler.handleValidationError(error, options)
    }

    if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return errorHandler.handleNetworkError(error, options)
    }

    // Default error handling
    return errorHandler.handleApiError(error, options)
  },

  // Success toast helper
  showSuccess: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    })
  },

  // Info toast helper
  showInfo: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    })
  },

  // Warning toast helper
  showWarning: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    })
  }
}

// Async wrapper for error handling
export const withErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> => {
  try {
    return await asyncFn()
  } catch (error) {
    errorHandler.handleError(error, options)
    return null
  }
}

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError: errorHandler.handleError,
    handleApiError: errorHandler.handleApiError,
    handleNetworkError: errorHandler.handleNetworkError,
    handleValidationError: errorHandler.handleValidationError,
    handleAuthError: errorHandler.handleAuthError,
    handlePermissionError: errorHandler.handlePermissionError,
    showSuccess: errorHandler.showSuccess,
    showInfo: errorHandler.showInfo,
    showWarning: errorHandler.showWarning,
    withErrorHandling
  }
}