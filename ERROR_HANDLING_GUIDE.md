# Error Handling Guide

This document outlines the comprehensive error handling system implemented in the thecommerce application.

## Overview

The application now features a unified error handling system that provides consistent user feedback through toast notifications for all types of errors including:

- API errors
- Network errors
- Authentication errors
- Validation errors
- Permission errors
- Unexpected application errors

## Components

### 1. Error Handler (`/lib/error-handler.ts`)

The central error handling utility that provides:

- **Consistent error categorization**: Different error types are handled appropriately
- **Toast notifications**: User-friendly error messages displayed via toast
- **Logging**: Errors are logged to console for debugging
- **Customizable options**: Control over toast display and logging

#### Usage Examples:

```typescript
import { useErrorHandler } from '@/lib/error-handler'

const { handleError, showSuccess, handleAuthError } = useErrorHandler()

// Handle general errors
try {
  await someApiCall()
} catch (error) {
  handleError(error, {
    title: "Operation Failed",
    description: "Unable to complete the operation"
  })
}

// Handle authentication errors
if (!user) {
  handleAuthError(null, {
    title: "Login Required",
    description: "Please log in to continue"
  })
}

// Show success messages
showSuccess("Success!", "Operation completed successfully")
```

### 2. API Client (`/lib/api-client.ts`)

A wrapper around fetch that provides:

- **Automatic error handling**: API errors are caught and displayed
- **Network error detection**: Offline/network issues are handled
- **Response validation**: Ensures API responses are valid
- **Success notifications**: Optional success toast messages

#### Usage Examples:

```typescript
import { apiClient } from '@/lib/api-client'

// GET request with error handling
const data = await apiClient.get('/api/products', {
  showErrorToast: true,
  showSuccessToast: false
})

// POST request with success message
const result = await apiClient.post('/api/cart', { productId: '123' }, {
  showSuccessToast: true,
  successMessage: "Item added to cart"
})
```

### 3. Error Boundary (`/components/error-boundary.tsx`)

React Error Boundary that catches unhandled errors:

- **Graceful fallback UI**: Shows user-friendly error page
- **Error recovery**: Allows users to retry or refresh
- **Error reporting**: Logs errors and shows toast notifications

#### Usage:

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 4. Updated Contexts

All context providers now use the unified error handling:

- **AuthContext**: Login, registration, password reset errors
- **CartContext**: Add/remove items, cart operations
- **FavoritesContext**: Favorite management operations

## Error Types and Handling

### 1. API Errors (4xx, 5xx responses)
- **Display**: Toast with specific error message from API
- **Logging**: Full error details logged to console
- **Recovery**: User can retry the operation

### 2. Network Errors
- **Display**: "Please check your internet connection" message
- **Detection**: Checks `navigator.onLine` status
- **Recovery**: Automatic retry when connection restored

### 3. Authentication Errors (401)
- **Display**: "Please log in" or "Authentication required" message
- **Action**: May redirect to login page
- **Context**: Handled specially in auth-related operations

### 4. Permission Errors (403)
- **Display**: "Permission denied" message
- **Context**: User lacks required permissions
- **Recovery**: Contact administrator or upgrade account

### 5. Validation Errors
- **Display**: Specific validation message
- **Context**: Form validation, input validation
- **Recovery**: User corrects input and retries

### 6. Unexpected Errors
- **Display**: Generic "Something went wrong" message
- **Fallback**: Error boundary shows recovery options
- **Recovery**: Refresh page or retry operation

## Toast Notifications

The application uses shadcn/ui toast system for consistent notifications:

### Success Toasts
- Green color scheme
- Positive messaging
- Automatic dismissal

### Error Toasts
- Red color scheme (destructive variant)
- Clear error description
- Manual dismissal option

### Configuration
- **Duration**: Configurable auto-dismiss timing
- **Position**: Consistent positioning across app
- **Styling**: Matches application theme

## Best Practices

### 1. Use Appropriate Error Handlers
```typescript
// For API calls
handleError(error, { title: "API Error" })

// For authentication
handleAuthError(error, { title: "Login Required" })

// For validation
handleValidationError(error, { title: "Invalid Input" })
```

### 2. Provide Meaningful Messages
```typescript
// Good
handleError(error, {
  title: "Failed to save product",
  description: "Unable to save your changes. Please try again."
})

// Avoid generic messages
handleError(error, { title: "Error" })
```

### 3. Handle Loading States
```typescript
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    await apiCall()
    showSuccess("Success", "Data saved successfully")
  } catch (error) {
    handleError(error)
  } finally {
    setLoading(false)
  }
}
```

### 4. Graceful Degradation
```typescript
// Provide fallback behavior
const data = await withErrorHandling(
  () => apiClient.get('/api/data'),
  { showErrorToast: true }
)

// Continue with default data if API fails
const finalData = data || defaultData
```

## Implementation Status

### ✅ Completed
- [x] Unified error handler utility
- [x] API client with error handling
- [x] Error boundary component
- [x] Updated all contexts (Auth, Cart, Favorites)
- [x] Updated layout with error boundary
- [x] Consistent toast system (shadcn/ui)
- [x] Updated review form component

### 🔄 In Progress
- [ ] Update remaining form components
- [ ] Add error handling to admin components
- [ ] Implement retry mechanisms
- [ ] Add error analytics/reporting

### 📋 Future Enhancements
- [ ] Offline error handling
- [ ] Error recovery suggestions
- [ ] User error reporting
- [ ] Error analytics dashboard
- [ ] Internationalization for error messages

## Testing Error Handling

### Manual Testing
1. **Network Errors**: Disconnect internet and try operations
2. **API Errors**: Test with invalid data or unauthorized requests
3. **Validation Errors**: Submit forms with invalid data
4. **Unexpected Errors**: Trigger JavaScript errors in components

### Error Scenarios to Test
- [ ] Login with invalid credentials
- [ ] Add items to cart while logged out
- [ ] Submit forms with missing required fields
- [ ] Network disconnection during API calls
- [ ] Server errors (500 responses)
- [ ] Invalid API responses
- [ ] Component rendering errors

## Monitoring and Debugging

### Console Logging
All errors are logged to console with full details for debugging.

### Error Information Includes
- Error message and stack trace
- Request/response details for API errors
- User context (authenticated, user ID)
- Timestamp and error type
- Component/context where error occurred

### Production Considerations
- Consider integrating with error monitoring service (Sentry, LogRocket)
- Implement error rate monitoring
- Set up alerts for critical errors
- Regular error log analysis

## Conclusion

The error handling system provides a robust foundation for user experience by:

1. **Consistent UX**: All errors display in the same format
2. **Clear Communication**: Users understand what went wrong
3. **Recovery Options**: Users can retry or take corrective action
4. **Developer Experience**: Easy to implement and debug
5. **Maintainability**: Centralized error handling logic

This system ensures that users are always informed about the application state and can take appropriate action when errors occur.