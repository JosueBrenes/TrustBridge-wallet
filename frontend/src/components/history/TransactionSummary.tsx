import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionStats } from '@/hooks/useTransactionHistory';

interface TransactionSummaryProps {
  stats: TransactionStats;
  isVisible: boolean;
}

export function TransactionSummary({ stats, isVisible }: TransactionSummaryProps) {
  if (!isVisible) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {stats.total}
            </div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {stats.successful}
            </div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {stats.failed}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFees.toFixed(7)}
            </div>
            <div className="text-sm text-muted-foreground">Total Fees (XLM)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}