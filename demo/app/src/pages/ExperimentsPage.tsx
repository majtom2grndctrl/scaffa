import { Box, Row, Stack } from "@scaffa/layout-primitives-react";
import { Beaker, Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { experiments } from "@/data/fixtures";

const statusClass = {
  running: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
};

export function ExperimentsPage() {
  return (
    <Stack gap={6}>
      <Row align="center" justify="between" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Experiment Lab
          </span>
          <h2 className="text-2xl font-display text-slate-900">
            Launch and track experiments
          </h2>
          <p className="text-sm text-slate-600">
            Manage canaries, A/Bs, and guardrail tuning before promotion.
          </p>
        </Stack>
        <Row align="center" gap={2} wrap="wrap">
          <Button variant="outline">Review approvals</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            New experiment
          </Button>
        </Row>
      </Row>

      <Card className="border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-4">
          <Row align="center" wrap="wrap" gap={3}>
            <div className="min-w-[220px] flex-1">
              <Input placeholder="Search experiments or owners..." />
            </div>
            <Select defaultValue="running">
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="canary">
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canary">Canary</SelectItem>
                <SelectItem value="ab">A/B</SelectItem>
                <SelectItem value="ramp">Ramp</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </CardContent>
      </Card>

      <Stack gap={3}>
        {experiments.map((experiment) => (
          <Card
            key={experiment.id}
            className="border-slate-200/70 bg-white/80 shadow-sm"
          >
            <CardContent className="p-4">
              <Row align="center" justify="between" wrap="wrap" gap={3}>
                <Stack gap={2} className="min-w-[240px]">
                  <Row align="center" gap={2}>
                    <Beaker className="h-4 w-4 text-indigo-500" />
                    <span className="text-base font-semibold text-slate-900">
                      {experiment.name}
                    </span>
                  </Row>
                  <span className="text-xs text-slate-500">
                    {experiment.owner} · {experiment.kind} · {experiment.started}
                  </span>
                </Stack>
                <Row align="center" gap={2} wrap="wrap">
                  <Badge
                    className={cn(
                      "rounded-full text-[0.65rem] uppercase tracking-widest",
                      statusClass[experiment.status]
                    )}
                  >
                    {experiment.status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Goal: {experiment.goal}
                  </Badge>
                </Row>
                <Row align="center" gap={3} wrap="wrap">
                  <Box className="min-w-[180px]">
                    <div className="text-xs text-slate-500">Coverage</div>
                    <Box className="mt-2 h-2 w-full rounded-full bg-slate-100">
                      <Box
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${experiment.coverage}%` }}
                      />
                    </Box>
                  </Box>
                  <Button variant="outline" size="sm">
                    View cohort
                  </Button>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                    <Flag className="mr-2 h-3.5 w-3.5" />
                    Promote
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
