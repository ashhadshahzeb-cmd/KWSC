import React, { useState } from 'react';
import { ShieldCheck, Phone, Globe, CreditCard } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MedicalCardProps {
    data: {
        card_no: string;
        participant_name: string;
        emp_no: string;
        cnic: string;
        customer_no: string;
        dob: string;
        valid_upto: string;
        branch: string;
        benefit_covered: string;
        hospitalization: string;
        room_limit: string;
        normal_delivery: string;
        c_section_limit: string;
        total_limit?: number;
        spent_amount?: number;
        remaining_balance?: number;
        [key: string]: any;
    };
}

const MedicalCard = ({ data }: MedicalCardProps) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Network background pattern
    const networkPattern = `
        radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
        linear-gradient(45deg, rgba(30, 41, 59, 1) 0%, rgba(15, 23, 42, 1) 100%)
    `;

    return (
        <div className="flex flex-col gap-6 items-center print:block print:w-full print:h-full">
            <div
                className="relative w-[85.6mm] h-[53.98mm] perspective-1000 cursor-pointer group print:hidden"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={cn(
                    "relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-xl",
                    isFlipped ? 'rotate-y-180' : ''
                )}>
                    {/* Front Side Display */}
                    <div className="absolute inset-0 backface-hidden w-full h-full">
                        <FrontSide data={data} background={networkPattern} />
                    </div>

                    {/* Back Side Display */}
                    <div className="absolute inset-0 backface-hidden w-full h-full rotate-y-180">
                        <BackSide data={data} background={networkPattern} />
                    </div>
                </div>
            </div>

            {/* Print View - Shows both sides stacked */}
            <div className="hidden print:flex print:flex-col print:gap-8 print:items-center print:justify-center print:w-full print:h-screen">
                <div className="w-[85.6mm] h-[53.98mm] shadow-none print:break-inside-avoid print:border print:border-gray-300 rounded-xl overflow-hidden">
                    <FrontSide data={data} background={networkPattern} />
                </div>
                <div className="w-[85.6mm] h-[53.98mm] shadow-none print:break-inside-avoid print:border print:border-gray-300 rounded-xl overflow-hidden">
                    <BackSide data={data} background={networkPattern} />
                </div>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

const FrontSide = ({ data, background }: { data: any, background: string }) => (
    <div
        className="w-full h-full relative text-white p-5 flex flex-col justify-between overflow-hidden rounded-xl"
        style={{ background }}
    >
        {/* Subtle Network Lines (CSS Overlay) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        />

        {/* Header */}
        <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-bl-xl rounded-tr-xl flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-tight tracking-wide">KWSC</h1>
                    <p className="text-[8px] text-gray-400 uppercase tracking-wider">RFID Card System</p>
                </div>
            </div>
            <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase border border-gray-600 px-2 py-0.5 rounded">
                RFID Card
            </span>
        </div>

        {/* Content */}
        <div className="flex justify-between items-end relative z-10 mt-2">
            {/* Left Details Box */}
            <div className="border border-gray-600 rounded bg-black/20 p-2 min-w-[180px] backdrop-blur-sm">
                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-[9px]">
                    <span className="text-gray-400 font-medium uppercase">Name:</span>
                    <span className="font-bold uppercase truncate max-w-[120px]">{data.participant_name}</span>

                    <span className="text-gray-400 font-medium uppercase">Member ID:</span>
                    <span className="font-mono font-bold">{data.card_no}</span>

                    <span className="text-gray-400 font-medium uppercase">Emp No:</span>
                    <span className="font-mono">{data.emp_no}</span>
                </div>
            </div>

            {/* Right Watermark Area */}
            <div className="text-right flex flex-col items-end">
                <ShieldCheck className="w-16 h-16 text-white/5 absolute bottom-12 right-4" />
                <div className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider">Primary Branch</div>
                <div className="font-bold text-xs uppercase">{data.branch || 'Main Campus'}</div>
            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-gray-400 relative z-10 border-t border-gray-700/50 pt-2 mt-1">
            <div className="flex gap-4">
                <div>
                    <span className="mr-1 opacity-70">Valid From:</span>
                    <span className="text-white font-mono">{new Date().toLocaleDateString()}</span>
                </div>
                <div>
                    <span className="mr-1 opacity-70">Expires:</span>
                    <span className="text-white font-mono">{new Date(data.valid_upto).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    </div>
);

const BackSide = ({ data, background }: { data: any, background: string }) => (
    <div
        className="w-full h-full relative text-white p-4 flex flex-col justify-between overflow-hidden rounded-xl"
        style={{ background }}
    >
        {/* Contact Info Header */}
        <div className="text-center relative z-10 space-y-0.5">
            <h3 className="text-[9px] uppercase font-bold tracking-widest text-gray-300">Emergency Contact</h3>
            <div className="flex items-center justify-center gap-1.5 text-base font-bold text-green-400">
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>1-800-KWSC</span>
            </div>
            <p className="text-[8px] text-gray-500">Provider Hotline: 1-887-HEALTHY</p>
        </div>

        {/* Barcode & Benefits */}
        <div className="flex flex-col items-center justify-center relative z-10">
            <div className="bg-white p-2 rounded w-4/5 flex flex-col items-center">
                {/* Fake Barcode using CSS */}
                <div className="h-7 w-full flex items-end justify-center gap-[2px] overflow-hidden opacity-80">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="bg-black" style={{ width: Math.random() > 0.5 ? 2 : 1, height: '100%' }} />
                    ))}
                </div>
                <span className="text-[7px] text-black font-mono font-bold tracking-[0.2em] mt-1">SCAN FOR BENEFITS</span>
            </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[6.5px] text-center text-gray-500 leading-tight relative z-10 px-3">
            IMPORTANT: PRESENT THIS CARD TO YOUR PROVIDER AT EACH VISIT.
            FOR A LIST OF PARTICIPATING PROVIDERS, VISIT OUR WEBSITE.
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end relative z-10">
            <div className="flex items-center gap-1 text-[7px] text-green-400/80">
                <Globe className="w-2.5 h-2.5" />
                <span>www.kwscmedical.com</span>
            </div>
            <div className="text-right">
                <div className="w-20 border-b border-gray-600 mb-0.5" />
                <p className="text-[6.5px] text-gray-500 uppercase tracking-widest">Authorized Signature</p>
            </div>
        </div>
        <div className="absolute bottom-2 right-2 opacity-20">
            <ShieldCheck className="w-7 h-7 text-white" />
        </div>
    </div>
);

export default MedicalCard;
