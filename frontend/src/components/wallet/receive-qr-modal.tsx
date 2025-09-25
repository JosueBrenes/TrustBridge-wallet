'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2, Check, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReceiveQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string;
}

export function ReceiveQRModal({ isOpen, onClose, publicKey }: ReceiveQRModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error copying address');
    }
  };

  const shareAddress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My TrustBridge Wallet Address',
          text: `Send me XLM to this address: ${publicKey}`,
          url: `stellar:${publicKey}`,
        });
      } catch {
        // If native share fails, copy to clipboard
        copyToClipboard();
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      copyToClipboard();
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector('#receive-qr-code svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'trustbridge-wallet-qr.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">
            Receive Payments
          </DialogTitle>
          <DialogDescription>
            Share your QR code or address to receive XLM
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code */}
          <div 
            id="receive-qr-code"
            className="p-4 bg-white rounded-xl shadow-inner border-2 border-gray-100"
          >
            <QRCodeSVG
              value={publicKey}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>

          {/* Address Display */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                Stellar Address
              </Badge>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-sm font-mono text-center break-all">
                {publicKey}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>

              <Button
                onClick={shareAddress}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>

            <Button
              onClick={downloadQR}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download QR</span>
            </Button>
          </div>

          {/* Info */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Share this QR code or address to receive payments on Stellar
            </p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">
                Ready to receive
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}