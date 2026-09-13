import { defaultShouldDehydrateQuery, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ORPCError } from "@orpc/client";
import { serializer } from "../serializer";

export type QueryClientErrorHandler = (error: unknown) => void;

export function isRateLimitError(error: unknown) {
  return error instanceof ORPCError && error.code === "RATE_LIMITER";
}

export function createQueryClient(onError?: QueryClientErrorHandler) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => onError?.(error),
    }),
    mutationCache: new MutationCache({
      onError: (error) => onError?.(error),
    }),
    defaultOptions: {
      queries: {
        queryKeyHashFn(queryKey) {
          const [json, meta] = serializer.serialize(queryKey);
          return JSON.stringify({ json, meta });
        },
        staleTime: 60 * 1000, // > 0 to prevent immediate refetching on mount
      },
      dehydrate: {
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        serializeData(data) {
          const [json, meta] = serializer.serialize(data);
          return { json, meta };
        },
      },
      hydrate: {
        deserializeData(data) {
          return serializer.deserialize(data.json, data.meta);
        },
      },
    },
  });
}
