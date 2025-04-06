import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  headers?: Record<string, string>,
  isFormData?: boolean
): Promise<Response> {
  let requestHeaders: Record<string, string> = { ...headers };
  let requestBody: any = undefined;
  
  // Handle different request body types
  if (data) {
    if (isFormData) {
      // FormData should be passed as is, without content-type header (browser sets it automatically with boundary)
      requestBody = data;
    } else {
      // Regular JSON data
      requestHeaders = { 
        ...requestHeaders,
        "Content-Type": "application/json" 
      };
      requestBody = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
