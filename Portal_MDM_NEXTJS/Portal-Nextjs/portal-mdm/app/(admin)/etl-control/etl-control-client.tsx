"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, BookText, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveCorridas } from "@/hooks/use-control-center";
import { LiveTab } from "./tabs/live-tab";
import { HistoryTab } from "./tabs/history-tab";
import { BitacoraTab } from "./tabs/bitacora-tab";

type EtlTab = "live" | "history" | "bitacora";

const VALID_TABS: readonly EtlTab[] = ["live", "history", "bitacora"];

export function EtlControlClient() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tabParam = search.get("tab");
  const tab: EtlTab = VALID_TABS.includes(tabParam as EtlTab)
    ? (tabParam as EtlTab)
    : "live";

  const activeQuery = useActiveCorridas();
  const liveCount = activeQuery.data?.length ?? 0;

  const setTab = (next: EtlTab) => {
    const sp = new URLSearchParams(search.toString());
    if (next === "live") sp.delete("tab");
    else sp.set("tab", next);
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as EtlTab)}
      className="flex flex-col gap-4"
    >
      <TabsList className="self-start">
        <TabsTrigger value="live" className="gap-1.5">
          <Activity aria-hidden className="h-3.5 w-3.5" />
          En vivo
          {liveCount > 0 && (
            <span
              aria-label={`${liveCount} corridas activas`}
              className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-semibold tabular-nums text-[var(--color-primary-foreground)]"
            >
              {liveCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5">
          <History aria-hidden className="h-3.5 w-3.5" />
          Historial
        </TabsTrigger>
        <TabsTrigger value="bitacora" className="gap-1.5">
          <BookText aria-hidden className="h-3.5 w-3.5" />
          Bitácora
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live" className="mt-0">
        <LiveTab />
      </TabsContent>
      <TabsContent value="history" className="mt-0">
        <HistoryTab />
      </TabsContent>
      <TabsContent value="bitacora" className="mt-0">
        <BitacoraTab />
      </TabsContent>
    </Tabs>
  );
}
