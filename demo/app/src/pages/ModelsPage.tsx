import { Link } from "react-router-dom";
import { Box, Row, Stack } from "@scaffa/layout-primitives-react";
import { Cpu, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { modelFleet } from "@/data/fixtures";

const statusClass = {
  healthy: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
  critical: "bg-rose-50 text-rose-700",
};

export function ModelsPage() {
  return (
    <Stack gap={6}>
      <Row align="center" justify="between" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Model Inventory
          </span>
          <h2 className="text-2xl font-display text-slate-900">
            Fleet governance
          </h2>
          <p className="text-sm text-slate-600">
            Track latency, drift, and coverage for every deployed algorithm.
          </p>
        </Stack>
        <Row align="center" gap={2} wrap="wrap">
          <Button variant="outline">Compare cohorts</Button>
          <Button>Schedule retrain</Button>
        </Row>
      </Row>

      <Card className="border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-4">
          <Row align="center" wrap="wrap" gap={3}>
            <div className="min-w-[220px] flex-1">
              <Input placeholder="Search models or owners..." />
            </div>
            <Select defaultValue="production">
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="canary">Canary</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="latency">
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latency">Latency</SelectItem>
                <SelectItem value="drift">Drift score</SelectItem>
                <SelectItem value="cost">Cost per 1k</SelectItem>
              </SelectContent>
            </Select>
            <Row align="center" gap={2}>
              <Checkbox id="risk-only" />
              <label
                htmlFor="risk-only"
                className="text-xs font-semibold text-slate-600"
              >
                Show only at-risk
              </label>
            </Row>
          </Row>
        </CardContent>
      </Card>

      <Stack gap={3}>
        {modelFleet.map((model) => (
          <Card
            key={model.id}
            className="border-slate-200/70 bg-white/80 shadow-sm"
          >
            <CardContent className="p-4">
              <Row align="center" justify="between" wrap="wrap" gap={3}>
                <Stack gap={2} className="min-w-[240px]">
                  <Row align="center" gap={2}>
                    <Cpu className="h-4 w-4 text-slate-500" />
                    <span className="text-base font-semibold text-slate-900">
                      {model.name}
                    </span>
                    <Badge
                      className={cn(
                        "rounded-full text-[0.65rem]",
                        statusClass[model.status]
                      )}
                    >
                      {model.status}
                    </Badge>
                  </Row>
                  <span className="text-xs text-slate-500">
                    {model.owner} · {model.stage} · {model.version}
                  </span>
                  <Row align="center" gap={2} wrap="wrap">
                    {model.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[0.6rem] uppercase tracking-widest"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </Row>
                </Stack>

                <Row align="center" gap={4} wrap="wrap">
                  <Stack gap={1} className="min-w-[120px]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      p95 latency
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {model.latencyP95}ms
                    </span>
                  </Stack>
                  <Stack gap={1} className="min-w-[120px]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      drift score
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {model.driftScore.toFixed(2)}
                    </span>
                  </Stack>
                  <Stack gap={1} className="min-w-[120px]">
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      cost / 1k
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      ${model.costPer1k.toFixed(2)}
                    </span>
                  </Stack>
                </Row>

                <Row align="center" gap={2} wrap="wrap">
                  <Badge
                    variant="outline"
                    className="rounded-full text-[0.65rem] uppercase tracking-widest text-slate-500"
                  >
                    {model.lastUpdated}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/models/${model.id}`}>
                      View details
                      <TrendingUp className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </Row>
              </Row>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
