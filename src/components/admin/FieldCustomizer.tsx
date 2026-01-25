import { useState } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FieldCustomizerProps {
    moduleName: string;
}

export const FieldCustomizer = ({ moduleName }: FieldCustomizerProps) => {
    const { isAdmin, customFields, addFieldLocally, deleteFieldLocally } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newField, setNewField] = useState({
        label: "",
        type: "text",
        isRequired: false,
    });

    if (!isAdmin) return null;

    const currentFields = customFields.filter(f => f.module_name === moduleName);

    const handleAddField = () => {
        if (!newField.label) return;
        setLoading(true);
        try {
            const fieldName = newField.label.toLowerCase().replace(/\s+/g, '_');
            addFieldLocally({
                module_name: moduleName,
                label: newField.label,
                field_name: fieldName,
                field_type: newField.type,
                is_required: newField.isRequired,
            });

            toast.success("Field added successfully (Local)");
            setNewField({ label: "", type: "text", isRequired: false });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteField = (id: string) => {
        try {
            deleteFieldLocally(id);
            toast.success("Field deleted (Local)");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/5">
                    <Settings2 className="w-4 h-4" />
                    Customize Fields
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass-card border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl">Customize {moduleName} Fields</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add Field Form */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Add New Field</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>Field Label</Label>
                                <Input
                                    value={newField.label}
                                    onChange={e => setNewField({ ...newField, label: e.target.value })}
                                    placeholder="e.g. Blood Group"
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Field Type</Label>
                                <Select value={newField.type} onValueChange={v => setNewField({ ...newField, type: v })}>
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddField} className="w-full rounded-xl h-11 font-bold shadow-lg" disabled={loading}>
                                {loading ? "Adding..." : "Add Field"}
                            </Button>
                        </div>
                    </div>

                    {/* Existing Fields List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Existing Fields</h3>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {currentFields.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">No custom fields yet.</p>
                            ) : (
                                currentFields.map(field => (
                                    <div key={field.id} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="font-bold text-sm">{field.label}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase">{field.field_type}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteField(field.id)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
