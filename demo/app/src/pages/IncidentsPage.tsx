import { Box, Row, Stack } from "@skaffa/layout-primitives-react";
import { AlertTriangle, Siren } from "lucide-react";

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
import { incidents } from "@/data/fixtures";

const severityStyles: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

export function IncidentsPage() {
  return (
    <Stack gap={6}>
      <Row align="center" justify="between" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Incident Control
          </span>
          <h2 className="text-2xl font-display text-slate-900">
            Live escalations
          </h2>
          <p className="text-sm text-slate-600">
            Coordinate on model degradations and operational risks.
          </p>
        </Stack>
        <Row align="center" gap={2} wrap="wrap">
          <Button variant="outline">Send summary</Button>
          <Button className="bg-rose-600 hover:bg-rose-700">
            Declare incident
          </Button>
        </Row>
      </Row>

      <Card className="border-slate-200/70 bg-white/80 shadow-sm">
        <CardContent className="p-4">
          <Row align="center" wrap="wrap" gap={3}>
            <div className="min-w-[220px] flex-1">
              <Input placeholder="Search incidents or owners..." />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Row align="center" gap={2}>
              <Checkbox id="resolved-only" />
              <label
                htmlFor="resolved-only"
                className="text-xs font-semibold text-slate-600"
              >
                Show resolved only
              </label>
            </Row>
          </Row>
        </CardContent>
      </Card>

      <Stack gap={3}>
        {incidents.map((incident) => (
          <Card
            key={incident.id}
            className="border-slate-200/70 bg-white/80 shadow-sm"
          >
            <CardContent className="p-4">
              <Row align="center" justify="between" wrap="wrap" gap={3}>
                <Stack gap={2} className="min-w-[240px]">
                  <Row align="center" gap={2}>
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <span className="text-base font-semibold text-slate-900">
                      {incident.title}
                    </span>
                  </Row>
                  <span className="text-xs text-slate-500">
                    {incident.opened} · {incident.impactedModels.join(", ")}
                  </span>
                </Stack>
                <Row align="center" gap={3} wrap="wrap">
                  <Badge
                    className={cn(
                      "rounded-full text-[0.65rem] uppercase tracking-widest",
                      severityStyles[incident.severity],
                    )}
                  >
                    {incident.severity}
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {incident.status}
                  </Badge>
                </Row>
                <Row align="center" gap={2} wrap="wrap">
                  <Button variant="outline" size="sm">
                    Assign owner
                  </Button>
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                    <Siren className="mr-2 h-3.5 w-3.5" />
                    Open war room
                  </Button>
                </Row>
              </Row>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Box className="rounded-xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-600">
        2 incidents are actively escalated. Next rotation handoff at 19:00 UTC.
      </Box>
    </Stack>
  );
}
