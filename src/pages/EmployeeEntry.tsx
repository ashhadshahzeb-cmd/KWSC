import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, QrCode, Printer, Trash2, Edit, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTreatment } from "@/contexts/TreatmentContext";
import { sqlApi, type TreatmentRecord } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FieldCustomizer } from "@/components/admin/FieldCustomizer";

const EmployeeEntry = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isAdmin, customFields } = useAuth();

    const moduleName = "EmployeeEntry";
    const moduleFields = customFields.filter(f => f.module_name === moduleName);
    const {
        employee,
        currentStep,
        qrCode,
        bookNo,
        patientType,
        patientNic,
        reference,
        vendor,
        setEmployee,
        setBookNo,
        setPatientType,
        setPatientNic,
        setReference,
        setVendor,
        clearSession,
        commitSession,
        goToDetailsStep,
        goBackToEmployee,
        setTreatmentType,
        treatmentType
    } = useTreatment();

    // Form state
    const [empNo, setEmpNo] = useState("");
    const [empName, setEmpName] = useState("");
    const [treatment, setTreatment] = useState("Medicine");
    const [patientName, setPatientName] = useState("");
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<TreatmentRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!loading && user) {
            loadRecords();
        }
    }, [user]);

    useEffect(() => {
        if (treatmentType) {
            setTreatment(treatmentType);
        }
    }, [treatmentType]);

    useEffect(() => {
        if (empNo.length >= 3 && !employee) {
            handleValidate();
        } else if (empNo.length === 0 && employee) {
            clearSession();
        }
    }, [empNo, employee]);

    const handleValidate = async () => {
        if (!empNo) return;
        setLoading(true);
        await setEmployee({ empNo, name: "" });
        setLoading(false);
    };

    const loadRecords = async () => {
        try {
            const params: any = { limit: 50 };

            // If not admin, restrict to own Employee No
            // We assume 'user' object has 'empNo' if it's a normal user
            if (!isAdmin && (user as any)?.empNo) {
                params.empNo = (user as any).empNo;
            }

            const data = await sqlApi.treatment.getRecords(params);
            setRecords(data);
        } catch (error: any) {
            console.error("Failed to load records", error);
        }
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Final validation if not already loaded
        if (!employee) {
            const success = await setEmployee({
                empNo,
                name: empName,
                bookNo,
                patientType,
                patientNic,
                reference,
                vendor
            });
            if (!success) {
                setLoading(false);
                return;
            }
        }

        setLoading(false);
        setTreatmentType(treatment);

        // Redirect to specialized module
        const routeMap: Record<string, string> = {
            'Medicine': '/medicine',
            'Laboratory': '/laboratory',
            'Hospital': '/hospital',
            'NoteSheet': '/note-sheet'
        };

        navigate(routeMap[treatment] || '/medicine');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await commitSession(treatment as any);
            await loadRecords();
            handleReset();
        } catch (error) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        clearSession();
        setEmpNo("");
        setEmpName("");
        setPatientName("");
        setBookNo("");
        setPatientType("Self");
        setPatientNic("");
        setReference("");
        setVendor("");
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-sky-700">Medical Entry Form</h1>
                </div>
                <div className="flex gap-2">
                    <FieldCustomizer moduleName={moduleName} />
                    <Button onClick={handleReset} variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100">
                        <RotateCcw className="mr-2 h-4 w-4" /> RESET
                    </Button>
                </div>
            </div>

            <Card className="p-6 border-2 border-sky-100 dark:border-sky-900 shadow-xl bg-card">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <div className="space-y-4 col-span-full mb-4 pb-4 border-b border-sky-100">
                            <h2 className="text-xl font-bold text-sky-800 flex items-center">
                                <span className="bg-sky-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                                Details
                            </h2>
                        </div>

                        {/* Dynamic Fields */}
                        {moduleFields.length > 0 && (
                            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg border border-sky-100 dark:border-sky-900 mb-4">
                                {moduleFields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="text-sky-900 font-semibold">{field.label}</Label>
                                        <Input
                                            type={field.field_type === 'number' ? 'number' : 'text'}
                                            placeholder={`Enter ${field.label}`}
                                            className="border-sky-200"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Book No</Label>
                            <Input value={bookNo} onChange={(e) => setBookNo(e.target.value)} className="border-sky-200" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Employee No *</Label>
                            <div className="flex gap-2">
                                <Input value={empNo} onChange={(e) => setEmpNo(e.target.value)} required className="border-sky-300 focus:ring-sky-500" />
                                <Button variant="secondary" className="bg-sky-200 text-sky-800 hover:bg-sky-300">Record</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Employee Name</Label>
                            <Input value={empName} onChange={(e) => setEmpName(e.target.value)} className="border-sky-200" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Treatment</Label>
                            <Select value={treatment} onValueChange={setTreatment}>
                                <SelectTrigger className="border-sky-200">
                                    <SelectValue placeholder="Select Treatment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Medicine">Medicine (Routine)</SelectItem>
                                    <SelectItem value="Laboratory">Laboratory / Tests</SelectItem>
                                    <SelectItem value="Hospital">Hospital / Services</SelectItem>
                                    <SelectItem value="NoteSheet">Note Sheet / Allowances</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Employee No *</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={empNo}
                                    onChange={(e) => setEmpNo(e.target.value)}
                                    required
                                    className="border-sky-300 focus:ring-sky-500 font-bold text-sky-800"
                                    placeholder="Enter ID..."
                                />
                                <Button onClick={handleValidate} variant="secondary" className="bg-sky-200 text-sky-800 hover:bg-sky-300">Details</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Employee Name</Label>
                            <Input value={employee?.name || empName} readOnly className="border-sky-200 bg-background font-medium" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Patient</Label>
                            <Select value={patientType} onValueChange={setPatientType}>
                                <SelectTrigger className="border-sky-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Self">Self</SelectItem>
                                    <SelectItem value="Wife">Wife</SelectItem>
                                    <SelectItem value="Wife2">Wife2</SelectItem>
                                    <SelectItem value="Wife3">Wife3</SelectItem>
                                    <SelectItem value="Mother">Mother</SelectItem>
                                    <SelectItem value="Father">Father</SelectItem>
                                    <SelectItem value="Son">Son</SelectItem>
                                    <SelectItem value="Daughter">Daughter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Patient Name</Label>
                            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="border-sky-200" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Patient NIC</Label>
                            <Input value={patientNic} onChange={(e) => setPatientNic(e.target.value)} placeholder="00000-0000000-0" className="border-sky-200" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Reference</Label>
                            <Input value={reference} onChange={(e) => setReference(e.target.value)} className="border-sky-200" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sky-900 font-semibold">Vendor</Label>
                            <Select value={vendor} onValueChange={setVendor}>
                                <SelectTrigger className="border-sky-200">
                                    <SelectValue placeholder="Select Vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dvago">Dvago</SelectItem>
                                    <SelectItem value="Dow">Dow</SelectItem>
                                    <SelectItem value="Faisal Medical">Faisal Medical</SelectItem>
                                    <SelectItem value="Fazal Medical">Fazal Medical</SelectItem>
                                    <SelectItem value="Chowrangi medical">Chowrangi medical</SelectItem>
                                    <SelectItem value="Alkhidmat Hospital">Alkhidmat Hospital</SelectItem>
                                    <SelectItem value="Patel Hospital">Patel Hospital</SelectItem>
                                    <SelectItem value="Kiran Hospital">Kiran Hospital</SelectItem>
                                    <SelectItem value="Hillpark hospital">Hillpark hospital</SelectItem>
                                    <SelectItem value="Karachi Advantic Hospital">Karachi Advantic Hospital</SelectItem>
                                    <SelectItem value="Trimax Hospital">Trimax Hospital</SelectItem>
                                    <SelectItem value="Fatima Dental">Fatima Dental</SelectItem>
                                    <SelectItem value="Chezal Dental">Chezal Dental</SelectItem>
                                    <SelectItem value="Jp Lab">Jp Lab</SelectItem>
                                    <SelectItem value="Dr wasif">Dr wasif</SelectItem>
                                    <SelectItem value="Dr izhar">Dr izhar</SelectItem>
                                    <SelectItem value="Dr zia">Dr zia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-full flex justify-end gap-3 pt-6 border-t border-sky-100">
                            <Button onClick={handleStep1Submit} className="bg-sky-600 hover:bg-sky-700 text-white min-w-[150px]">
                                Next: Add Items <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </Card>

            <div className="space-y-4 pt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-sky-800">Historical Records</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search records..."
                            className="pl-8 border-sky-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border rounded-xl shadow-sm overflow-hidden bg-card border-sky-100 dark:border-sky-900">
                    <Table>
                        <TableHeader className="bg-sky-50/50">
                            <TableRow>
                                <TableHead className="text-sky-800 font-bold">Serial No</TableHead>
                                <TableHead className="text-sky-800 font-bold">Emp No</TableHead>
                                <TableHead className="text-sky-800 font-bold">Employee Name</TableHead>
                                <TableHead className="text-sky-800 font-bold">Book No</TableHead>
                                <TableHead className="text-sky-800 font-bold">Treatment</TableHead>
                                <TableHead className="text-sky-800 font-bold">Visit Date</TableHead>
                                <TableHead className="text-sky-800 font-bold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No historical records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records.map((record) => (
                                    <TableRow key={record.Serial_no} className="hover:bg-sky-50/30 transition-colors">
                                        <TableCell className="font-bold text-sky-700">{record.Serial_no}</TableCell>
                                        <TableCell className="text-slate-600 font-medium">{record.Emp_no || 'N/A'}</TableCell>
                                        <TableCell className="font-bold text-sky-900">{record.Emp_name}</TableCell>
                                        <TableCell className="text-slate-600 font-medium">{record.Book_no || '-'}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                                                {record.Treatment}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{record.Visit_Date ? new Date(record.Visit_Date).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-600 hover:text-sky-800 hover:bg-sky-100">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div >
    );
};

export default EmployeeEntry;
