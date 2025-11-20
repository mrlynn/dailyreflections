# AbortController Best Practices in React

This document outlines best practices for using the `AbortController` API in React components to prevent issues like `AbortError` and memory leaks.

## Common Issues with AbortController

1. **Unmount Errors**: When a component unmounts while a fetch request is in progress, the request continues in the background but attempts to update state on an unmounted component, causing React warnings.

2. **Uncaught AbortErrors**: When a request is aborted but the error isn't properly caught or handled, causing unhandled promise rejections.

3. **Timeout Race Conditions**: When timeout mechanisms and component lifecycle events both try to abort the same controller, leading to unpredictable behavior.

## Best Practices

### 1. Create Controller at the Top Level of Your Effect

```javascript
useEffect(() => {
  // Create at the top level of the effect
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal
      });
      // Process response
    } catch (error) {
      // Handle errors
    }
  };

  fetchData();

  // Return cleanup function
  return () => {
    controller.abort('component unmounted');
  };
}, [dependencies]);
```

### 2. Always Clean Up Timeouts and Controllers

```javascript
useEffect(() => {
  const controller = new AbortController();
  let timeoutId = null;

  const fetchData = async () => {
    try {
      // Set timeout for the request
      timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort('timeout');
        }
      }, 5000);

      // Make the request
      const response = await fetch('/api/data', {
        signal: controller.signal
      });

      // Clear timeout on success
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Process response
    } catch (error) {
      // Handle errors
    }
  };

  fetchData();

  // Return cleanup function that handles BOTH controller and timeout
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    controller.abort('component unmounted');
  };
}, [dependencies]);
```

### 3. Check the Signal's State Before Taking Action

```javascript
// Check if the component was unmounted before proceeding
if (controller.signal.aborted) {
  console.log('Component was unmounted, skipping further operations');
  return;
}

// Only update state if the component is still mounted
if (!controller.signal.aborted) {
  setData(result);
}
```

### 4. Use Descriptive Abort Reasons

```javascript
// Modern browsers support abort reasons
controller.abort('component unmounted'); // Unmount
controller.abort('timeout exceeded');    // Timeout
controller.abort('user cancelled');      // User action
```

### 5. Distinguish Between Different Abort Causes

```javascript
try {
  const response = await fetch('/api/data', { signal: controller.signal });
  // Process response
} catch (error) {
  if (error.name === 'AbortError') {
    // Check for specific abort reasons
    if (controller.signal.reason === 'timeout exceeded') {
      console.warn('Request timed out');
    } else if (controller.signal.reason === 'component unmounted') {
      console.log('Request cancelled due to component unmount (expected)');
      return; // Don't update state or show errors for unmount aborts
    }
  } else {
    // Handle other errors
    console.error('Fetch error:', error);
  }
}
```

### 6. Single Responsibility Pattern

For complex components with multiple fetch requests, create a utility function:

```javascript
function useFetchWithAbort(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          ...options,
          signal
        });

        if (!signal.aborted) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !signal.aborted) {
          setError(error);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort('hook cleanup');
    };
  }, [url, JSON.stringify(options)]);

  return { data, error, loading };
}
```

### 7. Handling Multiple Fetch Requests

When a component needs to make multiple fetch requests:

```javascript
useEffect(() => {
  const controller = new AbortController();
  const { signal } = controller;

  const fetchAll = async () => {
    try {
      const [userResponse, postsResponse] = await Promise.all([
        fetch('/api/user', { signal }),
        fetch('/api/posts', { signal })
      ]);

      // Process responses if not aborted
      if (!signal.aborted) {
        const userData = await userResponse.json();
        const postsData = await postsResponse.json();
        // Update state
      }
    } catch (error) {
      // Handle errors
    }
  };

  fetchAll();

  return () => {
    controller.abort('component unmounted');
  };
}, []);
```

## Implementation Example from OnboardingProvider

Here's the improved implementation of the `checkOnboardingStatus` function in our OnboardingProvider:

```javascript
useEffect(() => {
  // Create controller outside of async function so we can clean it up properly
  const controller = new AbortController();
  let timeoutId = null;

  const checkOnboardingStatus = async () => {
    if (status === 'loading') return;

    // Early return if not authenticated
    if (!session?.user) {
      setOnboardingNeeded(false);
      setLoading(false);
      return;
    }

    try {
      // Add timeout to prevent hanging requests
      timeoutId = setTimeout(() => {
        // Only abort if the controller hasn't been aborted already
        if (!controller.signal.aborted) {
          controller.abort();
          console.warn('Fetch timeout in OnboardingProvider - request took too long');
        }
      }, 5000);

      // Check if the component was unmounted before we made the request
      if (controller.signal.aborted) {
        console.log('OnboardingProvider: Skipping fetch as component was unmounted');
        return;
      }

      // Fetch data with the abort signal
      const response = await fetch('/api/user/onboarding', {
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-cache',
      });

      // Clear timeout if the request completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Process response...
    } catch (error) {
      // Don't log errors if the component was unmounted - that's expected behavior
      if (error.name === 'AbortError' && controller.signal.aborted) {
        console.log('OnboardingProvider: Request was aborted because component unmounted');
      } else {
        console.error('Error checking onboarding status:', error);
      }
    } finally {
      // Only set loading to false if the component is still mounted
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  checkOnboardingStatus();

  // Cleanup function: abort any pending requests when the component unmounts
  return () => {
    console.log('OnboardingProvider: Component unmounting, cleaning up requests');
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    controller.abort('component unmounted');
  };
}, [session, status]);
```

## Testing AbortController Implementations

To test your AbortController implementation:

1. **Test Component Unmount During Fetch**: Render the component and force unmount during a slow fetch
2. **Test Timeout Conditions**: Use a mock server with intentional delays
3. **Test Error Handling**: Ensure AbortErrors are caught and handled properly
4. **Test Multiple Concurrent Requests**: Ensure all requests are properly aborted on unmount

Remember that proper AbortController implementation is not just about preventing errors but also about cleaning up resources and preventing memory leaks in your React applications.