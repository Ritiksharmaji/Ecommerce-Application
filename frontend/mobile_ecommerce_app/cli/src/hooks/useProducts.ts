import {productApi} from '@/services/api';
import {useAsync} from './useAsync';

/** The product catalogue (loaded once per screen; `reload` for pull-to-refresh). */
export function useProducts() {
  const {data, loading, refreshing, error, reload} = useAsync(productApi.getAll);
  return {products: data ?? [], loading, refreshing, error, refresh: reload};
}
