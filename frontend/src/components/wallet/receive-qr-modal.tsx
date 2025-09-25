'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ReceiveQR } from './receive-qr';

interface ReceiveQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string;
}

export function ReceiveQRModal({ isOpen, onClose, publicKey }: ReceiveQRModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">
            Receive Payments
          </DialogTitle>
          <DialogDescription>
            Share your QR code or address to receive XLM
          </DialogDescription>
        </DialogHeader>

        <ReceiveQR publicKey={publicKey} />
      </DialogContent>
    </Dialog>
  );
}