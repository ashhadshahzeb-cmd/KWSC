import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RotateCcw, Save, Edit, Trash2, Printer, QrCode, ArrowRight, ArrowLeft, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTreatment } from "@/contexts/TreatmentContext";
import { sqlApi, type TreatmentRecord } from "@/lib/api";
import { FieldCustomizer } from "@/components/admin/FieldCustomizer";
import { useAuth } from "@/contexts/AuthContext";
import { PDFDownloadLink } from "@react-pdf/renderer";
import TreatmentSlip from "@/components/reports/TreatmentSlip";

import { MedicineSuggestionInput } from "@/components/medicine/MedicineSuggestionInput";

const Medicine = () => {
  const { toast } = useToast();
  const {
    employee,
    items,
    currentStep,
    qrCode,
    store,
    invoiceNo,
    medicineAmount,
    setEmployee,
    updateItem,
    clearSession,
    commitSession,
    goToDetailsStep,
    goBackToEmployee,
    setStore,
    setInvoiceNo,
    setMedicineAmount,
  } = useTreatment();

  const { customFields } = useAuth();
  const moduleName = "Medicine";
  const moduleFields = customFields.filter(f => f.module_name === moduleName);

  const [searchId, setSearchId] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [lastSavedRecord, setLastSavedRecord] = useState<TreatmentRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await sqlApi.treatment.getRecords({ treatmentType: 'Medicine', limit: 50 });
      setRecords(data);
    } catch (error) {
      console.error("Failed to load records", error);
    }
  };

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

  const handleSave = async () => {
    if (!employee && !empNo) {
      toast({
        title: "Missing Information",
        description: "Please enter an Employee No first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Auto-validate if empNo is present but employee is not loaded
      if (!employee && empNo) {
        const validated = await setEmployee({ empNo, name: "" });
        if (!validated) {
          setLoading(false);
          return;
        }
      }

      const result = await commitSession('Medicine');
      if (result && result.success) {
        // Construct a temporary record for printing if needed immediately
        const tempRecord: TreatmentRecord = {
          Serial_no: 0, // Will be updated by reload but good for immediate view
          Emp_no: empNo,
          Emp_name: employee?.name || "Patient",
          Visit_Date: new Date().toISOString(),
          Patient_name: employee?.name || "Patient",
          Treatment: 'Medicine',
          Qr_code: result.qrCode,
          Book_no: employee?.bookNo,
          Medicine_amount: medicineAmount,
          ...items.reduce((acc, item, i) => ({
            ...acc,
            [`Medicine${i + 1}`]: item.name,
            [`Price${i + 1}`]: item.price,
          }), {}),
        };
        setLastSavedRecord(tempRecord);
      }
      await loadRecords();
      // Don't handleReset immediately if we want to show QR/Print
      // handleReset(); 
    } catch (error) {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearSession();
    setEmpNo("");
    setSearchId("");
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4">
      <div className="flex items-center justify-between border-b pb-4 bg-sky-600 p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold text-white tracking-wider">MEDICINE ENTRY SYSTEM</h1>
        <div className="flex gap-2">
          <FieldCustomizer moduleName={moduleName} />
          <Button onClick={handleReset} variant="outline" className="bg-white text-sky-700 hover:bg-sky-50 border-none font-bold">
            <RotateCcw className="mr-2 h-4 w-4" /> RESET
          </Button>
        </div>
      </div>

      <Card className="p-6 border-2 border-sky-100 dark:border-sky-900 shadow-2xl bg-card relative overflow-hidden">
        <div className="grid grid-cols-12 gap-8">

          {/* Left Column: Medicine Inputs */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <h3 className="text-sky-700 font-bold italic mb-4 border-b border-sky-200 pb-2">Medicine</h3>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <Label className="w-24 text-sky-800 dark:text-sky-300 font-medium text-sm">Medicine{i + 1}</Label>
                <MedicineSuggestionInput
                  value={items[i]?.name || ""}
                  onChange={(name, price) => updateItem(i, name, price || items[i]?.price || 0)}
                  className="h-8 border-sky-200 dark:border-sky-800 focus:border-sky-500"
                />
              </div>
            ))}
          </div>

          {/* Center Column: Employee & Metadata */}
          <div className="col-span-12 lg:col-span-6 space-y-6 px-4 border-l border-r border-sky-100">

            {/* Dynamic Fields Section */}
            {moduleFields.length > 0 && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-sky-50 rounded-lg border border-sky-100 mb-4">
                {moduleFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-sky-900 dark:text-sky-300 font-semibold">{field.label}</Label>
                    <Input
                      type={field.field_type === 'number' ? 'number' : 'text'}
                      placeholder={`Enter ${field.label}`}
                      className="border-sky-200 dark:border-sky-800"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">ID</Label>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="h-9 border-sky-300 dark:border-sky-700"
                  />
                  <Button className="h-9 bg-sky-600 hover:bg-sky-700 font-bold px-6">Search</Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">Employee No</Label>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={empNo}
                    onChange={(e) => setEmpNo(e.target.value)}
                    className="h-9 border-sky-500 ring-1 ring-sky-200 dark:ring-sky-900"
                  />
                  <Button onClick={handleValidate} disabled={loading} className="h-9 bg-sky-600 hover:bg-sky-700 font-bold px-6">Details</Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">Emp Name</Label>
                <Input value={employee?.name || ""} readOnly className="h-9 border-sky-200 dark:border-sky-800 bg-muted" />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">Store</Label>
                <Select value={store} onValueChange={setStore}>
                  <SelectTrigger className="h-9 border-sky-200">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Store 1">Store 1</SelectItem>
                    <SelectItem value="Pharmacy Central">Pharmacy Central</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">Invoice No</Label>
                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="h-9 border-sky-200" />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">Amount</Label>
                <Input
                  type="number"
                  value={medicineAmount || ""}
                  onChange={(e) => setMedicineAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 border-sky-200"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32 text-right font-bold text-sky-900 dark:text-sky-300">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 border-sky-200"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-8 border-t border-sky-100">
              <Button onClick={handleSave} disabled={loading} className="w-32 h-12 bg-sky-600 hover:bg-sky-700 text-white font-black text-lg shadow-lg">SAVE</Button>
              <Button className="w-32 h-12 bg-sky-500 hover:bg-sky-600 text-white font-black text-lg shadow-lg">UPDATE</Button>
              <Button onClick={handleReset} className="w-32 h-12 bg-sky-500 hover:bg-sky-600 text-white font-black text-lg shadow-lg">RESET</Button>
              <Button className="w-32 h-12 bg-sky-500 hover:bg-sky-600 text-white font-black text-lg shadow-lg">DELETE</Button>
            </div>
          </div>

          {/* Right Column: Quantity Inputs */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <h3 className="text-sky-700 font-bold italic mb-4 border-b border-sky-200 pb-2 text-right mr-4">Quantity</h3>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 group justify-end">
                <Label className="text-sky-800 dark:text-sky-300 font-medium text-sm">Quantity</Label>
                <Input
                  type="number"
                  value={items[i]?.price || 0}
                  onChange={(e) => updateItem(i, items[i]?.name || "", parseFloat(e.target.value) || 0)}
                  className="h-8 w-32 border-sky-200 dark:border-sky-800 focus:border-sky-500"
                />
              </div>
            ))}
          </div>

        </div>

        {qrCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-6 bg-white border-4 border-sky-500 rounded-xl flex flex-col items-center gap-4 shadow-2xl max-w-sm mx-auto z-10 relative"
          >
            <h4 className="text-sky-800 dark:text-sky-400 font-black text-xl">SCAN TO VERIFY</h4>
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            <div className="flex flex-col gap-2 w-full">
              {lastSavedRecord && (
                <PDFDownloadLink
                  document={<TreatmentSlip data={lastSavedRecord} />}
                  fileName={`Slip_${lastSavedRecord.Emp_no}_${new Date().getTime()}.pdf`}
                >
                  {({ loading: pdfLoading }) => (
                    <Button className="w-full bg-sky-600 hover:bg-sky-700">
                      <Printer className="mr-2 h-4 w-4" />
                      {pdfLoading ? "Generating..." : "Print Slip"}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
              <Button onClick={() => { handleReset(); setLastSavedRecord(null); }} variant="outline" className="w-full border-sky-200">Close</Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Historical Table */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-sky-800 flex items-center">
            <Activity className="mr-2 h-6 w-6" /> DATA HISTORY
          </h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
            <Input placeholder="Filter records..." className="pl-10 border-sky-100 bg-white" />
          </div>
        </div>

        <div className="border rounded-xl shadow-lg border-sky-100 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-sky-600">
              <TableRow>
                <TableHead className="text-white font-bold">SERIAL NO</TableHead>
                <TableHead className="text-white font-bold">EMP NO</TableHead>
                <TableHead className="text-white font-bold">EMP NAME</TableHead>
                <TableHead className="text-white font-bold">BOOK NO</TableHead>
                <TableHead className="text-white font-bold">DATE</TableHead>
                <TableHead className="text-white font-bold">STORE</TableHead>
                <TableHead className="text-white font-bold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-sky-400 italic">No records found</TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.Serial_no} className="hover:bg-sky-50/50 transition-colors">
                    <TableCell className="font-bold text-sky-700">{record.Serial_no}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{record.Emp_no || 'N/A'}</TableCell>
                    <TableCell className="font-bold text-sky-900">{record.Emp_name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{record.Book_no || '-'}</TableCell>
                    <TableCell className="text-slate-500">{record.Visit_Date ? new Date(record.Visit_Date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-slate-600 italic">{record.Store || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <PDFDownloadLink
                          document={<TreatmentSlip data={record} />}
                          fileName={`Slip_${record.Serial_no}.pdf`}
                        >
                          <Button variant="ghost" size="icon" className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 h-8 w-8">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </PDFDownloadLink>
                        <Button variant="ghost" size="icon" className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8">
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
    </div>
  );
};

export default Medicine;
