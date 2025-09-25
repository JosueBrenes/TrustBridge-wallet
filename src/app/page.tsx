import WalletSection from '@/components/WalletSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        <WalletSection />
      </div>
    </div>
  );
}
