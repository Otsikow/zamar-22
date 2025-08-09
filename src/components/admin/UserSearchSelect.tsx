import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Props {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
}

const displayName = (p?: Profile | null) =>
  p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || p.id : "";

const UserSearchSelect: React.FC<Props> = ({ value, onChange, placeholder = "Search by name or email" }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);

  // Fetch selected profile label when value changes
  useEffect(() => {
    const fetchSelected = async () => {
      if (!value) { setSelected(null); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("id", value)
        .maybeSingle();
      setSelected((data as Profile) || null);
    };
    fetchSelected();
  }, [value]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(async () => {
      const term = search.trim();
      if (term.length < 2) { setResults([]); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        .order("first_name", { ascending: true })
        .limit(20);
      if (!error) setResults((data as Profile[]) || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSelect = (p: Profile) => {
    onChange(p.id);
    setSelected(p);
    setOpen(false);
  };

  const clearSelection = () => {
    onChange("");
    setSelected(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <UserIcon className="h-4 w-4" />
            {selected ? (
              <span className="truncate">{displayName(selected)}{selected?.email ? ` (${selected.email})` : ""}</span>
            ) : (
              <span className="text-muted-foreground">Select user</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {selected && (
              <X
                className="h-4 w-4 opacity-60 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              />
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px] sm:w-[420px]" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching...
              </div>
            )}
            {!loading && search.trim().length < 2 && (
              <CommandEmpty>Type at least 2 characters…</CommandEmpty>
            )}
            {!loading && search.trim().length >= 2 && results.length === 0 && (
              <CommandEmpty>No users found.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Users">
                {results.map((p) => (
                  <CommandItem key={p.id} value={`${p.email ?? ""} ${p.first_name ?? ""} ${p.last_name ?? ""}`}
                    onSelect={() => handleSelect(p)}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    <div className="flex-1 truncate">
                      <div className="truncate">{displayName(p)}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                    </div>
                    {value === p.id && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSearchSelect;
