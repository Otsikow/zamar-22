import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Save, X, RefreshCw } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  ad_type: "banner" | "audio" | string;
  target_url: string | null;
  media_url: string | null;
  frequency: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const AdManagerList = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState({ title: "", target_url: "", frequency: 1 });

  const loadAds = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to load ads", variant: "destructive" });
    } else {
      setAds(data as Ad[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleToggleActive = async (ad: Ad) => {
    const next = !(ad.is_active ?? true);
    const { error } = await supabase.from("ads").update({ is_active: next }).eq("id", ad.id);
    if (error) {
      toast({ title: "Error", description: "Could not update status", variant: "destructive" });
      return;
    }
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, is_active: next } : a)));
  };

  const handleDelete = async (ad: Ad) => {
    const confirm = window.confirm(`Delete ad “${ad.title}”?`);
    if (!confirm) return;
    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (error) {
      toast({ title: "Error", description: "Could not delete ad", variant: "destructive" });
      return;
    }
    setAds((prev) => prev.filter((a) => a.id !== ad.id));
    toast({ title: "Deleted", description: "Ad removed" });
  };

  const startEdit = (ad: Ad) => {
    setEditing(ad);
    setEditForm({
      title: ad.title,
      target_url: ad.target_url || "",
      frequency: ad.frequency || 1,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("ads")
      .update({ title: editForm.title, target_url: editForm.target_url, frequency: editForm.frequency })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Error", description: "Could not save changes", variant: "destructive" });
      return;
    }
    setAds((prev) =>
      prev.map((a) => (a.id === editing.id ? { ...a, title: editForm.title, target_url: editForm.target_url, frequency: editForm.frequency } : a))
    );
    setEditing(null);
    toast({ title: "Saved", description: "Ad updated" });
  };

  const empty = useMemo(() => !loading && ads.length === 0, [loading, ads.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Existing Ads</h3>
        <Button variant="outline" size="sm" onClick={loadAds} aria-label="Refresh ads">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading ads…</div>
      )}

      {empty && (
        <div className="text-sm text-muted-foreground">No ads yet. Create one above.</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {ads.map((ad) => (
          <Card key={ad.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-sm uppercase tracking-wide">{ad.ad_type}</span>
                    <span className="text-xs text-muted-foreground">• {new Date(ad.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 font-semibold truncate">{ad.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{ad.target_url || "—"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Frequency: {ad.frequency ?? 1}</div>
                </div>

                {ad.ad_type === "banner" && ad.media_url && (
                  <img
                    src={ad.media_url}
                    alt={`${ad.title} banner`}
                    className="w-full md:w-48 h-24 object-contain rounded-md border border-border"
                    loading="lazy"
                  />
                )}

                {ad.ad_type === "audio" && ad.media_url && (
                  <audio className="w-full md:w-64" controls src={ad.media_url} />
                )}

                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!ad.is_active}
                      onCheckedChange={() => handleToggleActive(ad)}
                      id={`active-${ad.id}`}
                    />
                    <Label htmlFor={`active-${ad.id}`}>Active</Label>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => startEdit(ad)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Ad</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                          </div>
                          <div>
                            <Label htmlFor="target">Target URL</Label>
                            <Input id="target" value={editForm.target_url} onChange={(e) => setEditForm({ ...editForm, target_url: e.target.value })} />
                          </div>
                          <div>
                            <Label htmlFor="freq">Frequency</Label>
                            <Input
                              id="freq"
                              type="number"
                              min={1}
                              value={editForm.frequency}
                              onChange={(e) => setEditForm({ ...editForm, frequency: parseInt(e.target.value || "1", 10) })}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditing(null)}>
                              <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                            <Button onClick={saveEdit}>
                              <Save className="h-4 w-4 mr-2" /> Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="destructive" size="sm" onClick={() => handleDelete(ad)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdManagerList;
