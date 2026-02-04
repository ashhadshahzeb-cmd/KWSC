import React, { useState } from 'react';
import {
    QrCode, Scan, AlertCircle, Loader2, CreditCard,
    Calendar, User, Building, DollarSign, TrendingUp,
    TrendingDown, Clock, ChevronRight, History,
    ShieldCheck, Activity, Wallet, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CardData {
    cardNo: string;
    participantName: string;
    empNo: string;
    cnic: string;
    dob: string;
    validUpto: string;
    branch: string;
    totalLimit: number;
    spentAmount: number;
    remainingBalance: number;
    lastUpdate: string;
}

interface TreatmentRecord {
    type: string;
    date: string;
    amount: number;
    labName?: string;
    hospitalName?: string;
}

const CardScanner = () => {
    const [cardData, setCardData] = useState<CardData | null>(null);
    const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [manualCardNo, setManualCardNo] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Auto-lookup if ID is in URL
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setManualCardNo(id);
            // Delay slightly to ensure handleLookup is ready (hoisting is safe but pattern is better)
            setTimeout(() => handleLookup(id), 500);
        }
    }, []);

    const handleLookup = async (identifier: string) => {
        if (!identifier || !identifier.trim()) {
            setError('Please enter a card number or employee number');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Use production URL as fallback if env variable is missing
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://kwscmedicalsystem.vercel.app';
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

            console.log(`Scanning card: ${identifier} via ${cleanBaseUrl}`);
            const response = await fetch(`${cleanBaseUrl}/api/cards/scan/${identifier}`);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setCardData(result.card);
                setTreatments(result.recentTreatments || []);
                setIsDialogOpen(true);
            } else {
                setError(result.error || 'Card not found');
            }
        } catch (err: any) {
            setError('Failed to fetch card data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getBalancePercentage = (remaining: number, total: number) => {
        if (total === 0) return 0;
        return Math.min(Math.max((remaining / total) * 100, 0), 100);
    };

    const getBalanceInfo = (remaining: number, total: number) => {
        const percentage = getBalancePercentage(remaining, total);
        if (percentage > 50) return { color: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-600', label: 'Healthy' };
        if (percentage > 20) return { color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'bg-yellow-600', label: 'Low Balance' };
        return { color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-600', label: 'Critical' };
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Scan className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight">KWSC Medical Portal</h1>
                            </div>
                            <p className="text-blue-100 text-sm md:text-base font-medium opacity-90">
                                Real-time Card Verification & Balance Management
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Card */}
                <Card className="border-none shadow-lg overflow-hidden">
                    <CardHeader className="bg-white dark:bg-slate-900 pb-4">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-blue-600" />
                            Verify Card
                        </CardTitle>
                        <CardDescription>Enter card/employee details to view current entitlement and history</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={manualCardNo}
                                    onChange={(e) => setManualCardNo(e.target.value)}
                                    placeholder="Enter Card Number (e.g. 10245)"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                                    onKeyPress={(e) => e.key === 'Enter' && handleLookup(manualCardNo)}
                                />
                            </div>
                            <Button
                                onClick={() => handleLookup(manualCardNo)}
                                disabled={loading}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Scan className="w-5 h-5 mr-2" />
                                )}
                                Verify Card
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-700 animate-in fade-in slide-in-from-top-4">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription className="font-medium">{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Results Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-slate-50 dark:bg-slate-950 border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
                        {cardData && (
                            <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh]">
                                {/* Dialog Header / Top Branding */}
                                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shrink-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm px-3 py-1 font-bold">
                                            RFID VERIFIED
                                        </Badge>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-100 uppercase tracking-widest font-bold opacity-80 mb-1">Update ID</p>
                                            <p className="text-sm font-mono font-medium">{new Date().getTime().toString().slice(-8)}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
                                            {cardData.participantName}
                                        </h2>
                                        <p className="text-blue-100 text-sm font-medium opacity-80">
                                            Emp ID: <span className="text-white">{cardData.empNo}</span> | Card: <span className="text-white">{cardData.cardNo}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                    {/* Balance Logic Visualization */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Wallet className="w-4 h-4 text-blue-600" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Authorized Limit</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(cardData.totalLimit)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingDown className="w-4 h-4 text-red-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Utilized</span>
                                            </div>
                                            <p className="text-lg font-bold text-red-600">{formatCurrency(cardData.spentAmount)}</p>
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-xl border-none shadow-sm",
                                            getBalanceInfo(cardData.remainingBalance, cardData.totalLimit).bg
                                        )}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity className={cn("w-4 h-4", getBalanceInfo(cardData.remainingBalance, cardData.totalLimit).color)} />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-70", getBalanceInfo(cardData.remainingBalance, cardData.totalLimit).color)}>Balance Available</span>
                                            </div>
                                            <p className={cn("text-lg font-bold", getBalanceInfo(cardData.remainingBalance, cardData.totalLimit).color)}>
                                                {formatCurrency(cardData.remainingBalance)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar Visualization */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                            <span>Limit Utilization</span>
                                            <span className={getBalanceInfo(cardData.remainingBalance, cardData.totalLimit).color}>
                                                {Math.round(100 - getBalancePercentage(cardData.remainingBalance, cardData.totalLimit))}% SPENT
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-1000 ease-out", getBalanceInfo(cardData.remainingBalance, cardData.totalLimit).bar)}
                                                style={{ width: `${getBalancePercentage(cardData.remainingBalance, cardData.totalLimit)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Medical Branch</p>
                                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                <Building className="w-4 h-4 text-slate-400" />
                                                {cardData.branch}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Validity Period</p>
                                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                Until {formatDate(cardData.validUpto)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Card (CNIC)</p>
                                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                <Info className="w-4 h-4 text-slate-400" />
                                                {cardData.cnic}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Benefit Status</p>
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50 font-bold">
                                                ACTIVE COVERAGE
                                            </Badge>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Recent Activity */}
                                    <div className="space-y-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                                <History className="w-4 h-4 text-blue-600" />
                                                Medical Usage History
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 10 Visits</span>
                                        </div>

                                        {treatments.length > 0 ? (
                                            <div className="space-y-3">
                                                {treatments.map((treatment, index) => (
                                                    <div
                                                        key={index}
                                                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all hover:shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                                                <Activity className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{treatment.type}</p>
                                                                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                                                    {formatDate(treatment.date)} • {treatment.hospitalName || treatment.labName || 'Medical Facility'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-red-600">-{formatCurrency(treatment.amount)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                                                <p className="text-sm font-medium text-slate-400 italic">No recent claims or visits found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                    <Button
                                        onClick={() => setIsDialogOpen(false)}
                                        className="w-full h-12 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
                                    >
                                        Done / Print Receipt
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            `}} />
        </div>
    );
};

const SearchIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export default CardScanner;

