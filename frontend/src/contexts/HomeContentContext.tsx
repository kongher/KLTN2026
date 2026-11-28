import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_HOME_SETTINGS, normalizeHomeSettings } from "../utils/homeSettings";
import { fetchHomeContent } from "../services/homeService";
import type { HomeReview, HomeSettings, HomeVoucher } from "../types/home";

type HomeContentContextValue = {
  settings: HomeSettings;
  reviews: HomeReview[];
  vouchers: HomeVoucher[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const HomeContentContext = createContext<HomeContentContextValue | undefined>(undefined);

export function HomeContentProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<HomeSettings>(EMPTY_HOME_SETTINGS);
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [vouchers, setVouchers] = useState<HomeVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const content = await fetchHomeContent();
      setSettings(normalizeHomeSettings(content.settings));
      setReviews(content.reviews || []);
      setVouchers(content.vouchers || []);
    } catch {
      setSettings(EMPTY_HOME_SETTINGS);
      setReviews([]);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ settings, reviews, vouchers, loading, refresh }),
    [settings, reviews, vouchers, loading, refresh]
  );

  return <HomeContentContext.Provider value={value}>{children}</HomeContentContext.Provider>;
}

export function useHomeContent() {
  const context = useContext(HomeContentContext);
  if (!context) {
    throw new Error("useHomeContent must be used within HomeContentProvider");
  }
  return context;
}
