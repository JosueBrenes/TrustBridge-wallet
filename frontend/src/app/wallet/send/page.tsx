"use client";

import { Send } from "lucide-react";
import { SendForm } from "@/components/wallet/send-form";

export default function SendPage() {
  return (
      <div className="space-y-6">
        <div>
        <div className="flex items-center gap-2 mb-2">
          <Send className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Send XLM</h1>
        </div>
        <p className="text-muted-foreground">
          Send XLM to any Stellar address securely and quickly.
        </p>
        </div>

        <SendForm />
      </div>
    );
  }