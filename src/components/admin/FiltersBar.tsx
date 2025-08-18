import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FiltersState {
  period: 'last_7' | 'last_30' | 'last_90' | 'all' | 'custom';
  date_from: Date | null;
  date_to: Date | null;
  status_filter: string;
  gen_filter: string;
  search_text: string;
}

interface FiltersBarProps {
  state: FiltersState;
  onStateChange: (updates: Partial<FiltersState>) => void;
  onExportCSV: () => void;
}

export function FiltersBar({ state, onStateChange, onExportCSV }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-background/50 rounded-lg border border-primary/20">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="search" className="text-sm text-muted-foreground">Search</Label>
        <Input
          id="search"
          placeholder="Search earner/referred..."
          value={state.search_text}
          onChange={(e) => onStateChange({ search_text: e.target.value })}
          className="mt-1"
        />
      </div>

      {/* Status Filter */}
      <div className="min-w-[120px]">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select value={state.status_filter} onValueChange={(value) => onStateChange({ status_filter: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Generation Filter */}
      <div className="min-w-[120px]">
        <Label className="text-sm text-muted-foreground">Generation</Label>
        <Select value={state.gen_filter} onValueChange={(value) => onStateChange({ gen_filter: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1">Gen-1</SelectItem>
            <SelectItem value="2">Gen-2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Period Filter */}
      <div className="min-w-[140px]">
        <Label className="text-sm text-muted-foreground">Period</Label>
        <Select value={state.period} onValueChange={(value) => onStateChange({ period: value as FiltersState['period'] })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7">Last 7 days</SelectItem>
            <SelectItem value="last_30">Last 30 days</SelectItem>
            <SelectItem value="last_90">Last 90 days</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range (only show when period is custom) */}
      {state.period === 'custom' && (
        <>
          <div className="min-w-[140px]">
            <Label className="text-sm text-muted-foreground">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !state.date_from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {state.date_from ? format(state.date_from, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={state.date_from || undefined}
                  onSelect={(date) => onStateChange({ date_from: date || null })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="min-w-[140px]">
            <Label className="text-sm text-muted-foreground">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !state.date_to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {state.date_to ? format(state.date_to, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={state.date_to || undefined}
                  onSelect={(date) => onStateChange({ date_to: date || null })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Export Button */}
      <div className="flex items-end">
        <Button onClick={onExportCSV} variant="outline" className="mt-auto">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}