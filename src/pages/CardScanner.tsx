import React, { useState } from 'react';
import { QrCode, Scan, AlertCircle, Loader2, CreditCard, Calendar, User, Building, DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sqlApi } from '@/lib/api';

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
    const [scanning, setScanning] = useState(false);
    const [cardData, setCardData] = useState<CardData | null>(null);
    const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [manualCardNo, setManualCardNo] = useState('');

    const handleScan = async (data: string | null) => {
        if (!data) return;

        setLoading(true);
        setError(null);

        try {
            // Decode QR code data
            const qrData = JSON.parse(data);
            const identifier = qrData.cardNo || qrData.empNo;

            if (!identifier) {
                setError('Invalid QR code format');
                setLoading(false);
                return;
            }

            // Fetch card balance from backend
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cards/scan/${identifier}`);
            const result = await response.json();

            if (result.success) {
                setCardData(result.card);
                setTreatments(result.recentTreatments || []);
                setScanning(false);
            } else {
                setError(result.error || 'Card not found');
            }
        } catch (err: any) {
            setError('Failed to read QR code. Please try again.');
            console.error('Scan error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualLookup = async () => {
        if (!manualCardNo.trim()) {
            setError('Please enter a card number or employee number');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cards/scan/${manualCardNo}`);
            const result = await response.json();

            if (result.success) {
                setCardData(result.card);
                setTreatments(result.recentTreatments || []);
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

    const getBalanceColor = (remaining: number, total: number) => {
        const percentage = (remaining / total) * 100;
        if (percentage > 50) return 'text-green-600';
        if (percentage > 25) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Card Scanner</h1>
                        <p className="text-gray-600">Scan KWSC Medical Cards to View Balance</p>
                    </div>
                    <QrCode className="w-12 h-12 text-blue-600" />
                </div>

                {/* Scanner Controls */}
                {!cardData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan Medical Card</CardTitle>
                            <CardDescription>Scan the QR code on the back of the medical card or enter card number manually</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Manual Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualCardNo}
                                    onChange={(e) => setManualCardNo(e.target.value)}
                                    placeholder="Enter Card Number or Employee Number"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                                />
                                <Button onClick={handleManualLookup} disabled={loading}>
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Lookup'
                                    )}
                                </Button>
                            </div>

                            {/* Camera Scanner Note */}
                            <Alert>
                                <Scan className="w-4 h-4" />
                                <AlertDescription>
                                    QR code camera scanner requires HTTPS (works on deployed site). Use manual lookup for testing.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Card Data Display */}
                {cardData && (
                    <>
                        {/* Balance Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Total Limit</p>
                                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(cardData.totalLimit)}</p>
                                        </div>
                                        <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Amount Spent</p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(cardData.spentAmount)}</p>
                                        </div>
                                        <TrendingDown className="w-10 h-10 text-red-600 opacity-20" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Remaining Balance</p>
                                            <p className={`text-2xl font-bold ${getBalanceColor(cardData.remainingBalance, cardData.totalLimit)}`}>
                                                {formatCurrency(cardData.remainingBalance)}
                                            </p>
                                        </div>
                                        <TrendingUp className={`w-10 h-10 opacity-20 ${getBalanceColor(cardData.remainingBalance, cardData.totalLimit)}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Card Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Card Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Cardholder Name</p>
                                            <p className="font-semibold text-gray-900">{cardData.participantName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Card Number</p>
                                            <p className="font-semibold text-gray-900 font-mono">{cardData.cardNo}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Employee Number</p>
                                            <p className="font-semibold text-gray-900">{cardData.empNo}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Branch</p>
                                            <p className="font-semibold text-gray-900">{cardData.branch}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Valid Until</p>
                                            <p className="font-semibold text-gray-900">{formatDate(cardData.validUpto)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Last Updated</p>
                                            <p className="font-semibold text-gray-900">{formatDate(cardData.lastUpdate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Treatments */}
                        {treatments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Treatments</CardTitle>
                                    <CardDescription>Last 10 treatment records</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {treatments.map((treatment, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{treatment.type}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(treatment.date)}
                                                        {treatment.labName && <> • {treatment.labName}</>}
                                                        {treatment.hospitalName && <> • {treatment.hospitalName}</>}
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-red-600">{formatCurrency(treatment.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reset Button */}
                        <div className="flex justify-center">
                            <Button
                                onClick={() => {
                                    setCardData(null);
                                    setTreatments([]);
                                    setManualCardNo('');
                                    setError(null);
                                }}
                                variant="outline"
                            >
                                <Scan className="w-4 h-4 mr-2" />
                                Scan Another Card
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CardScanner;
