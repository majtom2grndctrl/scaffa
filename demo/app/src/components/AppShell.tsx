import { NavLink, Outlet } from "react-router-dom";
import { Box, Row, Stack } from "@skaffa/layout-primitives-react";
import { Activity, AlertTriangle, Beaker, Layers, Radar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Overview", to: "/", icon: Activity, badge: "Live" },
  { label: "Models", to: "/models", icon: Layers, badge: "24" },
  { label: "Incidents", to: "/incidents", icon: AlertTriangle, badge: "3" },
  { label: "Experiments", to: "/experiments", icon: Beaker, badge: "4" },
];

export function AppShell() {
  return (
    <Box className="relative min-h-screen overflow-hidden bg-[#f7f4ef] text-foreground">
      <Box className="pointer-events-none absolute -top-32 right-[-12%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(96,165,250,0.45),_rgba(248,250,252,0))] blur-3xl" />
      <Box className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[linear-gradient(120deg,_rgba(255,255,255,0.35)_0%,_rgba(219,234,254,0.2)_45%,_rgba(255,255,255,0)_100%)]" />
      <Row align="stretch" gap={0} className="relative z-10 min-h-screen">
        <Box className="hidden w-[260px] border-r border-slate-200/70 bg-white/75 backdrop-blur md:block">
          <Stack p={6} gap={6} className="h-full">
            <Stack gap={2}>
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                ModelOps Console
              </span>
              <Row align="center" gap={2}>
                <span className="text-2xl font-display text-slate-900">
                  Aurora Ops
                </span>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </Row>
              <p className="text-sm text-slate-600">
                Production control for AI performance.
              </p>
            </Stack>

            <Stack gap={2}>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100",
                      )
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <Badge
                      variant={
                        item.label === "Incidents" ? "destructive" : "secondary"
                      }
                      className={cn(
                        "h-5 rounded-full px-2 text-[0.65rem]",
                        item.label === "Overview" &&
                          "bg-slate-200 text-slate-700",
                      )}
                    >
                      {item.badge}
                    </Badge>
                  </NavLink>
                );
              })}
            </Stack>

            <Card className="mt-auto border-slate-200/70 bg-white/80 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Runtime Signal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <Row align="center" gap={2} className="text-xs">
                  <Radar className="h-4 w-4 text-emerald-500" />
                  <span>All inference clusters responding.</span>
                </Row>
                <p className="text-xs text-slate-500">
                  Next health sweep in 2m 14s.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Open diagnostics
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        <Stack p={6} gap={6} className="flex-1">
          <Row align="center" justify="between" wrap="wrap" gap={4}>
            <Stack gap={1}>
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Operations
              </span>
              <h1 className="text-3xl font-display text-slate-900">
                Pulseboard
              </h1>
              <p className="text-sm text-slate-600">
                Monitor model health, latency, and policy guardrails in real
                time.
              </p>
            </Stack>
            <Row align="center" gap={3} wrap="wrap">
              <div className="w-full min-w-[220px] sm:w-auto">
                <Input placeholder="Search models, runs, alerts..." />
              </div>
              <Select defaultValue="production">
                <SelectTrigger className="w-[160px] bg-white/80">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
              <Button className="shadow-none">New experiment</Button>
            </Row>
          </Row>

          <Row align="center" wrap="wrap" gap={2} className="md:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600",
                      isActive && "border-slate-900 text-slate-900",
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </Row>

          <main className="flex-1">
            <Outlet />
          </main>
        </Stack>
      </Row>
    </Box>
  );
}
