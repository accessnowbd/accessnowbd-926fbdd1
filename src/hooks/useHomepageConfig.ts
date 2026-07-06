import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  fetchHomepageConfig,
  type HomepageConfig,
} from "@/lib/homepage-config";

/** Load homepage config with realtime updates when admin edits. */
export function useHomepageConfig(initial?: HomepageConfig) {
  const [config, setConfig] = useState<HomepageConfig>(initial ?? DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    let alive = true;
    fetchHomepageConfig()
      .then((c) => {
        if (alive) setConfig(c);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const ch = supabase
      .channel("homepage_config_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_records", filter: "kind=eq.homepage_config" },
        () => {
          fetchHomepageConfig().then((c) => {
            if (alive) setConfig(c);
          });
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return { config, loading };
}
