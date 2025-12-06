import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        refetchOnWindowFocus: true,
      },
    },
  });
};

export function getQueryClient() {
  if (typeof window !== "undefined") {
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }

  return makeQueryClient();
}