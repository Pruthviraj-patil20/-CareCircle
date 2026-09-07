"use client";

import { Phone, ShieldAlert, AlertTriangle, Flame, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmergencyContactItem } from "@/types/emergency";

interface QuickServiceDialerProps {
  customServices: EmergencyContactItem[];
}

export function QuickServiceDialer({ customServices }: QuickServiceDialerProps) {
  // Built-in standard hotlines
  const defaultHotlines = [
    {
      title: "Emergency Services",
      subtitle: "Police, Fire, Medical",
      number: "911",
      icon: ShieldAlert,
      color: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-none",
      border: "border-rose-300 dark:border-rose-800",
    },
    {
      title: "Poison Control",
      subtitle: "24/7 Expert Advice",
      number: "1-800-222-1222",
      icon: AlertTriangle,
      color: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 dark:shadow-none",
      border: "border-amber-300 dark:border-amber-800",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-rose-500" />
          1-Tap Emergency Speed Dial
        </h3>
        <span className="text-[11px] text-muted-foreground">Mobile instant connect</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {defaultHotlines.map((hotline) => {
          const Icon = hotline.icon;
          return (
            <a
              key={hotline.number}
              href={`tel:${hotline.number.replace(/[^0-9]/g, "")}`}
              className="block group"
            >
              <Card className={`border ${hotline.border} transition-all duration-200 hover:scale-[1.02] shadow-xs cursor-pointer`}>
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground group-hover:text-rose-600 transition-colors">
                      {hotline.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{hotline.subtitle}</p>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                      {hotline.number}
                    </p>
                  </div>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hotline.color} shadow-sm group-hover:scale-105 transition-transform`}>
                    <Phone className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}

        {/* Custom configured services (e.g. local police station, pediatrician 24h hotline) */}
        {customServices.map((service) => (
          <a
            key={service.id}
            href={`tel:${service.phone.replace(/[^0-9+]/g, "")}`}
            className="block group"
          >
            <Card className="border border-border/80 transition-all duration-200 hover:scale-[1.02] shadow-xs cursor-pointer">
              <CardContent className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {service.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {service.relationship || "Local Service"}
                  </p>
                  <p className="text-xs font-semibold text-primary mt-1 truncate">
                    {service.phone}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
