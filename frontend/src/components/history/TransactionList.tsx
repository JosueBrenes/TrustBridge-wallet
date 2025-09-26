import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';
import { ProcessedTransaction } from '@/lib/stellar';

interface TransactionListProps {
  transactions: ProcessedTransaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  publicKey: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
  onOpenInStellarExpert: (hash: string) => void;
}

export function TransactionList({
  transactions,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  publicKey,
  onRefresh,
  onLoadMore,
  onCopyToClipboard,
  onOpenInStellarExpert
}: TransactionListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatAmount = (amount: string, asset: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    
    if (num < 0.01) {
      return `${num.toFixed(7)} ${asset}`;
    }
    return `${num.toFixed(2)} ${asset}`;
  };

  const getTransactionIcon = (type: string, isOutgoing: boolean) => {
    if (type.toLowerCase().includes('receive') || (!isOutgoing && type.toLowerCase().includes('payment'))) {
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    } else if (type.toLowerCase().includes('send') || (isOutgoing && type.toLowerCase().includes('payment'))) {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  const getTransactionColor = (type: string, isOutgoing: boolean) => {
    if (type.toLowerCase().includes('receive') || (!isOutgoing && type.toLowerCase().includes('payment'))) {
      return 'text-green-600';
    } else if (type.toLowerCase().includes('send') || (isOutgoing && type.toLowerCase().includes('payment'))) {
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transactions ({transactions.length})</span>
          {transactions.length > 0 && (
            <Badge variant="secondary">
              Showing {transactions.length} transactions
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {isLoading && transactions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transaction history...</p>
          </div>
        ) : transactions.length === 0 && !isLoading ? (
          <div className="p-6 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground">
              Your transaction history will appear here once you start using your wallet.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => {
              const { date, time } = formatDate(tx.date);
              const isOutgoing = tx.from === publicKey;
              
              return (
                <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTransactionIcon(tx.type, isOutgoing)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{tx.type}</span>
                          {tx.successful ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {tx.operationCount > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {tx.operationCount} ops
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{date} at {time}</div>
                          
                          {tx.from && tx.to && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="truncate max-w-[120px]">{tx.from}</span>
                              <ArrowUpRight className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{tx.to}</span>
                            </div>
                          )}
                          
                          {tx.memo && (
                            <div className="text-xs">
                              <span className="font-medium">Memo:</span> {tx.memo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {parseFloat(tx.amount) > 0 && (
                        <div className={`font-medium ${getTransactionColor(tx.type, isOutgoing)}`}>
                          {isOutgoing && tx.type.toLowerCase().includes('payment') ? '-' : ''}
                          {formatAmount(tx.amount, tx.asset)}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyToClipboard(tx.hash, 'Transaction hash')}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenInStellarExpert(tx.hash)}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {parseFloat(tx.fee) > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Fee: {formatAmount(tx.fee, 'XLM')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading more...
                </>
              ) : (
                'Load More Transactions'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}