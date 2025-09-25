"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { DefindexModal } from "./defindex-modal";
import Image from "next/image";

interface DeFiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeFiModal({ isOpen, onClose }: DeFiModalProps) {
  const [showDefindexModal, setShowDefindexModal] = useState(false);

  const handleBlendClick = () => {
    // TODO: Implementar navegación a Blend
    console.log("Navegando a Blend...");
  };

  const handleDefindexClick = () => {
    setShowDefindexModal(true);
  };

  const handleDefindexClose = () => {
    setShowDefindexModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              DeFi Options
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleBlendClick}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image 
                    src="/blend.png" 
                    alt="Blend Protocol" 
                    width={20} 
                    height={20}
                    className="rounded-sm"
                  />
                  Blend Protocol
                </CardTitle>
                <CardDescription>
                  Lending and borrowing protocol on Stellar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Access Blend
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleDefindexClick}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image 
                    src="/defindex.png" 
                    alt="DeFindex" 
                    width={20} 
                    height={20}
                    className="rounded-sm"
                  />
                  DeFindex
                </CardTitle>
                <CardDescription>
                  Automated yield strategies and portfolio management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Explore Strategies
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <DefindexModal isOpen={showDefindexModal} onClose={handleDefindexClose} />
    </>
  );
}
