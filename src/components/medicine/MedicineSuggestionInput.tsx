import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { sqlApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search, Pill } from "lucide-react";

interface MedicineSuggestionInputProps {
    value: string;
    onChange: (value: string, price?: number) => void;
    className?: string;
    placeholder?: string;
}

export const MedicineSuggestionInput = ({
    value,
    onChange,
    className,
    placeholder = "Search medicine..."
}: MedicineSuggestionInputProps) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (search: string) => {
        if (!search || search.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const data = await sqlApi.medicines.getAll(search);
            setSuggestions(data);
            setIsOpen(data.length > 0);
        } catch (error) {
            console.error("Error fetching medicine suggestions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        onChange(newVal);
        fetchSuggestions(newVal);
    };

    const handleSelect = (med: any) => {
        onChange(med.name, med.price);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <Input
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => value.length >= 2 && setIsOpen(true)}
                    className={cn("pr-8", className)}
                    placeholder={placeholder}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2">
                    {suggestions.map((med) => (
                        <div
                            key={med.id}
                            onClick={() => handleSelect(med)}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors border-b last:border-0"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Pill className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-foreground">{med.name}</div>
                                {med.category && (
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{med.category}</div>
                                )}
                            </div>
                            {med.price > 0 && (
                                <div className="text-xs font-bold text-success">Rs. {med.price}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
