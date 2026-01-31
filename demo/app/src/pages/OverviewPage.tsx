import { Box, Row, Stack } from "@skaffa/layout-primitives-react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  driftSignals,
  experiments,
  incidents,
  kpiMetrics,
  modelFleet,
} from "@/data/fixtures";

const toneClasses: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  neutral: "bg-slate-100 text-slate-600",
};

const statusClasses: Record<string, string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
  critical: "bg-rose-50 text-rose-700",
};

export function OverviewPage() {
  return (
    <Stack gap={6}>
      <Row align="center" justify="between" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            System Overview
          </span>
          <h2 className="text-2xl font-display text-slate-900">
            Fleet pulse and drift signals
          </h2>
          <p className="text-sm text-slate-600">
            Consolidated health across production traffic and model guardrails.
          </p>
        </Stack>
        <Row align="center" gap={2} wrap="wrap">
          <Button variant="outline">Download report</Button>
          <Button>Escalate incident</Button>
        </Row>
      </Row>

      <Row gap={4} wrap="wrap">
        {kpiMetrics.map((metric) => (
          <Card
            key={metric.label}
            className="min-w-[220px] flex-1 border-slate-200/70 bg-white/80 shadow-sm"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-600">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-display text-slate-900">
                {metric.value}
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                  toneClasses[metric.tone],
                )}
              >
                {metric.delta}
              </span>
            </CardContent>
          </Card>
        ))}
      </Row>

      <Row gap={4} wrap="wrap">
        <Card className="min-w-[280px] flex-[1.2] border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Drift and anomaly feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {driftSignals.map((signal) => (
              <Box
                key={signal.id}
                className="rounded-xl border border-slate-200/80 bg-white/70 p-3"
              >
                <Row align="center" justify="between" gap={2}>
                  <Stack gap={1}>
                    <span className="text-sm font-semibold text-slate-800">
                      {signal.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {signal.detail}
                    </span>
                  </Stack>
                  <Badge
                    className={cn(
                      "rounded-full text-[0.65rem] uppercase tracking-widest",
                      signal.status === "critical"
                        ? "bg-rose-100 text-rose-700"
                        : signal.status === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {signal.status}
                  </Badge>
                </Row>
                <Row align="center" justify="between" gap={2} className="pt-2">
                  <span className="text-xs text-slate-500">{signal.owner}</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {signal.trend}
                  </span>
                </Row>
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card className="min-w-[280px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Deployment health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Box className="rounded-xl border border-slate-200/70 bg-white p-4">
              <Row align="center" justify="between" gap={2}>
                <Stack gap={1}>
                  <span className="text-sm font-semibold text-slate-800">
                    Real-time guardrails
                  </span>
                  <span className="text-xs text-slate-500">
                    98.2% policy compliance
                  </span>
                </Stack>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </Row>
              <Box className="mt-3 h-2 w-full rounded-full bg-slate-100">
                <Box className="h-2 w-[92%] rounded-full bg-emerald-400" />
              </Box>
            </Box>
            <Box className="rounded-xl border border-slate-200/70 bg-white p-4">
              <Row align="center" justify="between" gap={2}>
                <Stack gap={1}>
                  <span className="text-sm font-semibold text-slate-800">
                    Feature freshness
                  </span>
                  <span className="text-xs text-slate-500">
                    4 pipelines behind SLA
                  </span>
                </Stack>
                <ArrowUpRight className="h-5 w-5 text-amber-500" />
              </Row>
              <Box className="mt-3 h-2 w-full rounded-full bg-slate-100">
                <Box className="h-2 w-[68%] rounded-full bg-amber-400" />
              </Box>
            </Box>
            <Box className="rounded-xl border border-slate-200/70 bg-white p-4">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Top traffic models
              </span>
              <Stack gap={2} className="mt-3">
                {modelFleet.slice(0, 3).map((model) => (
                  <Row
                    key={model.id}
                    align="center"
                    justify="between"
                    gap={2}
                    className="text-sm"
                  >
                    <span className="font-semibold text-slate-700">
                      {model.name}
                    </span>
                    <Badge
                      className={cn(
                        "rounded-full text-[0.65rem]",
                        statusClasses[model.status],
                      )}
                    >
                      {model.status}
                    </Badge>
                  </Row>
                ))}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Row>

      <Row gap={4} wrap="wrap">
        <Card className="min-w-[280px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Active experiments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {experiments.slice(0, 2).map((experiment) => (
              <Box
                key={experiment.id}
                className="rounded-xl border border-slate-200/70 bg-white p-3"
              >
                <Row align="center" justify="between" gap={2}>
                  <Stack gap={1}>
                    <span className="text-sm font-semibold text-slate-800">
                      {experiment.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {experiment.goal}
                    </span>
                  </Stack>
                  <Badge className="rounded-full text-[0.65rem] uppercase tracking-widest">
                    {experiment.status}
                  </Badge>
                </Row>
                <Box className="mt-3 h-2 w-full rounded-full bg-slate-100">
                  <Box
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${experiment.coverage}%` }}
                  />
                </Box>
                <span className="mt-2 block text-xs text-slate-500">
                  Coverage {experiment.coverage}% · {experiment.started}
                </span>
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card className="min-w-[280px] flex-1 border-slate-200/70 bg-white/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Incident queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidents.map((incident) => (
              <Box
                key={incident.id}
                className="rounded-xl border border-slate-200/70 bg-white p-3"
              >
                <Row align="center" justify="between" gap={2}>
                  <Stack gap={1}>
                    <span className="text-sm font-semibold text-slate-800">
                      {incident.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {incident.opened} · {incident.impactedModels.join(", ")}
                    </span>
                  </Stack>
                  <Badge
                    className={cn(
                      "rounded-full text-[0.65rem] uppercase tracking-widest",
                      incident.severity === "high"
                        ? "bg-rose-100 text-rose-700"
                        : incident.severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {incident.severity}
                  </Badge>
                </Row>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Row>
    </Stack>
  );
}
