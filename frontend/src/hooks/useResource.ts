import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

type ResourceLoader<T> = (signal: AbortSignal) => Promise<T>;

/** Tải dữ liệu khi `load` hoặc `refreshKey` đổi; huỷ yêu cầu cũ khi component rời màn hình. */
export function useResource<T>(load: ResourceLoader<T>, refreshKey?: unknown): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, isLoading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, isLoading: true }));
    load(controller.signal)
      .then((data) => setState({ data, error: null, isLoading: false }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'Không tải được dữ liệu.',
          isLoading: false
        });
      });
    return () => controller.abort();
  }, [load, refreshKey]);

  return state;
}
