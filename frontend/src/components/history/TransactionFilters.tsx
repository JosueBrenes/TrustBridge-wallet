import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { TransactionFilters as FilterType } from '@/hooks/useTransactionHistory';

interface TransactionFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: Partial<FilterType>) => void;
}

export function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by hash, type, address, or memo..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filters.filterType}
              onChange={(e) => onFiltersChange({ filterType: e.target.value as FilterType['filterType'] })}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Transactions</option>
              <option value="send">Sent</option>
              <option value="receive">Received</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}