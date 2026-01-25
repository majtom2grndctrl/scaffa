import { useParams } from "react-router-dom";
import { Box, Row, Stack } from "@scaffa/layout-primitives-react";
import { ArrowDownRight, Shield, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { modelDetailNotes, modelFleet } from "@/data/fixtures";

const statusClass = {
  healthy: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
  critical: "bg-rose-50 text-rose-700",
};

export function ModelDetailPage() {
  const { modelId } = useParams();
  const model = modelFleet.find((entry) => entry.id === modelId) ?? modelFleet[0];
  const details = modelDetailNotes[model.id] ?? modelDetailNotes["atlas-vision"];

  return (
    <Stack gap={6}>
      <Row align="center" justify="between" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Model Detail
          </span>
          <Row align="center" gap={2} wrap="wrap">
            <h2 className="text-2xl font-display text-slate-900">
              {model.name}
            </h2>
            <Badge
              className={cn(
                "rounded-full text-[0.65rem]",
                statusClass[model.status]
              )}
            >
              {model.status}
            </Badge>
          </Row>
          <p className="text-sm text-slate-600">
            {details.description} · {details.coverage}
          </p>
        </Stack>
        <Row align="center" gap={2} wrap="wrap">
          <Button variant="outline">Run evaluation</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Rollback</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rollback deployment</DialogTitle>
                <DialogDescription>
                  Move traffic back to the previous stable version while
                  preserving experiment telemetry.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                Current version {model.version} · Last retrain {details.lastRetrain}
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Confirm rollback</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Row>
      </Row>

      <Row gap={4} wrap="wrap">
        <Card className="min-w-[220px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              p95 latency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-display text-slate-900">
              {model.latencyP95}ms
            </div>
            <span className="text-xs text-slate-500">
              +18ms from baseline
            </span>
          </CardContent>
        </Card>
        <Card className="min-w-[220px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              drift score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-display text-slate-900">
              {model.driftScore.toFixed(2)}
            </div>
            <span className="text-xs text-slate-500">
              New segment detected
            </span>
          </CardContent>
        </Card>
        <Card className="min-w-[220px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Cost per 1k
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-display text-slate-900">
              ${model.costPer1k.toFixed(2)}
            </div>
            <span className="text-xs text-slate-500">
              Budget steady
            </span>
          </CardContent>
        </Card>
      </Row>

      <Row gap={4} wrap="wrap">
        <Card className="min-w-[280px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Guardrails & policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {details.guardrails.map((guardrail) => (
              <Row key={guardrail} align="center" gap={2}>
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-slate-700">{guardrail}</span>
              </Row>
            ))}
            <Box className="rounded-xl border border-slate-200/70 bg-white p-3 text-xs text-slate-500">
              Guardrail bundle updated by {details.owners.join(", ")}.
            </Box>
          </CardContent>
        </Card>

        <Card className="min-w-[280px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Version cadence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Stack gap={2}>
              {details.versions.map((version) => (
                <Row
                  key={version}
                  align="center"
                  justify="between"
                  gap={2}
                  className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-700">{version}</span>
                  <Badge variant="secondary" className="text-[0.65rem]">
                    {model.stage}
                  </Badge>
                </Row>
              ))}
            </Stack>
            <Row align="center" gap={2} className="text-xs text-slate-500">
              <ArrowDownRight className="h-4 w-4 text-amber-500" />
              Retrain window opens in 5 days.
            </Row>
          </CardContent>
        </Card>
      </Row>

      <Card className="border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Live telemetry snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Row align="center" wrap="wrap" gap={4}>
            <Box className="min-w-[220px] flex-1 rounded-xl border border-slate-200/70 bg-white p-4">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Recall
              </span>
              <div className="mt-2 text-2xl font-display text-slate-900">
                98.7%
              </div>
              <span className="text-xs text-slate-500">
                +0.4% from last week
              </span>
            </Box>
            <Box className="min-w-[220px] flex-1 rounded-xl border border-slate-200/70 bg-white p-4">
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Throughput
              </span>
              <div className="mt-2 text-2xl font-display text-slate-900">
                4.2k / sec
              </div>
              <span className="text-xs text-slate-500">
                7% headroom available
              </span>
            </Box>
            <Box className="min-w-[220px] flex-1 rounded-xl border border-slate-200/70 bg-white p-4">
              <Row align="center" gap={2}>
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span className="text-xs uppercase tracking-widest text-slate-400">
                  Quality mix
                </span>
              </Row>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 w-[78%] rounded-full bg-indigo-500" />
              </div>
              <span className="mt-2 block text-xs text-slate-500">
                Target 80% coverage
              </span>
            </Box>
          </Row>
        </CardContent>
      </Card>
    </Stack>
  );
}
