import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Search, CheckCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTreatment } from "@/contexts/TreatmentContext";
import { sqlApi, type TreatmentRecord } from "@/lib/api";
import { PDFDownloadLink } from "@react-pdf/renderer";
import TreatmentSlip from "@/components/reports/TreatmentSlip";
import { FieldCustomizer } from "@/components/admin/FieldCustomizer";

const Laboratory = () => {
  const { toast } = useToast();
  const {
    employee,
    items,
    currentStep,
    qrCode,
    setEmployee,
    updateItem,
    clearSession,
    commitSession,
    goToDetailsStep,
    goBackToEmployee,
  } = useTreatment();

  // Employee form state
  const [empNo, setEmpNo] = useState("");
  const [empName, setEmpName] = useState("");
  const [labName, setLabName] = useState("");
  const [loading, setLoading] = useState(false);

  // Historical records
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<TreatmentRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const lastSyncedId = useRef<string | null>(null);

  // Sync local state when employee changes in context (Auto-fill)
  useEffect(() => {
    const syncKey = employee ? `${employee.id}-${employee.empNo}` : null;
    if (employee && syncKey !== lastSyncedId.current) {
      setEmpNo(employee.empNo || "");
      setEmpName(employee.name || "");
      lastSyncedId.current = syncKey;
    } else if (!employee) {
      lastSyncedId.current = null;
    }
  }, [employee]);

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const data = await sqlApi.treatment.getRecords({ treatmentType: 'Lab', limit: 50 });
      setRecords(data);
    } catch (error: any) {
      toast({
        title: "Error Loading Records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!labName) {
      toast({
        title: "Lab Name Required",
        description: "Please enter the laboratory name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await setEmployee({ empNo, name: empName });
    setLoading(false);

    if (success) {
      goToDetailsStep();
    }
  };

  // Voice Data Entry Listener
  useEffect(() => {
    const handleVoiceEntry = (e: any) => {
      const { field, value } = e.detail;

      if (field.startsWith('medicine')) {
        const index = parseInt(field.replace('medicine', '')) - 1;
        updateItem(index, value, items[index]?.price || 0);
      }
      else if (field.startsWith('quantity')) {
        const index = parseInt(field.replace('quantity', '')) - 1;
        updateItem(index, items[index]?.name || "", parseFloat(value) || 0);
      }
      else if (field === 'empNo') {
        setEmpNo(value);
      }
      else if (field === 'empName' || (field === 'name' && currentStep === 'employee')) {
        setEmpName(value);
      }
    };

    window.addEventListener('voice-data-entry', handleVoiceEntry);
    return () => window.removeEventListener('voice-data-entry', handleVoiceEntry);
  }, [items, updateItem, currentStep]);

  const handleItemsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await commitSession('Lab', { labName });
      if (result && result.success) {
        const tempRecord: TreatmentRecord = {
          Serial_no: 0,
          Emp_no: empNo,
          Emp_name: employee?.name || empName || "Patient",
          Visit_Date: new Date().toISOString(),
          Patient_name: employee?.name || empName || "Patient",
          Treatment: 'Lab',
          Qr_code: result.qrCode || "",
          Book_no: employee?.bookNo,
          Lab_name: labName,
          ...items.reduce((acc, item, i) => ({
            ...acc,
            [`Medicine${i + 1}`]: item.name,
            [`Price${i + 1}`]: item.price,
          }), {}),
        };
        setLastSavedRecord(tempRecord);
      }
      await loadRecords();
    } catch (error) {
      // Error handled by commitSession
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntry = () => {
    clearSession();
    setEmpNo("");
    setEmpName("");
    setLabName("");
    setLastSavedRecord(null);
  };

  const filteredRecords = records.filter(
    (record) =>
      record.Emp_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.Emp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.Lab_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Laboratory Tests</h1>
          <p className="text-muted-foreground">Track laboratory tests and diagnostics using Treatment2 table</p>
        </div>
        <FieldCustomizer moduleName="Laboratory" />
      </div>

      <Card className="p-6">
        <AnimatePresence mode="wait">
          {currentStep === 'employee' && (
            <motion.div
              key="employee"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">Step 1: Employee & Laboratory Information</h2>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Employee No *</Label>
                    <Input
                      value={empNo}
                      onChange={(e) => setEmpNo(e.target.value)}
                      placeholder="Enter Employee No"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Name *</Label>
                    <Input
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      placeholder="Enter Employee Name"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Laboratory Name *</Label>
                    <Input
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="e.g., City Lab"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                {employee && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    Cycle: {employee.cycleNo} | Month: {employee.allowMonth}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    Next: Add Tests
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Step 2: Laboratory Tests</h2>
                <Button variant="outline" size="sm" onClick={goBackToEmployee}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              {employee && (
                <div className="text-sm bg-primary/10 p-3 rounded">
                  <strong>Employee:</strong> {employee.name} ({employee.empNo}) |
                  <strong className="ml-2">Laboratory:</strong> {labName} |
                  <strong className="ml-2">Cycle:</strong> {employee.cycleNo} of {employee.allowMonth}
                </div>
              )}

              <form onSubmit={handleItemsSubmit} className="space-y-4">
                <div className="space-y-3">
                  <Label>Test Names & Prices (Up to 10)</Label>
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(index, e.target.value, item.price)}
                          placeholder={`Test ${index + 1} (e.g., Blood Test, X-Ray)`}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => updateItem(index, item.name, parseFloat(e.target.value) || 0)}
                          placeholder="Price (PKR)"
                          min={0}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Total: PKR {calculateTotal().toLocaleString()}
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 'summary' && qrCode && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Lab Record Saved!</h2>
                <p className="text-muted-foreground">
                  Laboratory tests for {employee?.name} at {labName} have been saved
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg inline-block">
                <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Scan QR Code</p>
              </div>

              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                {lastSavedRecord && (
                  <PDFDownloadLink
                    document={<TreatmentSlip data={lastSavedRecord} />}
                    fileName={`LabSlip_${lastSavedRecord.Emp_no}_${new Date().getTime()}.pdf`}
                  >
                    {({ loading: pdfLoading }) => (
                      <Button className="w-full bg-sky-600 hover:bg-sky-700" size="lg">
                        <Printer className="mr-2 h-5 w-5" />
                        {pdfLoading ? "Generating..." : "Print Slip"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
                <Button onClick={handleNewEntry} size="lg" variant="outline" className="border-sky-200">
                  Add Another Record
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Historical Records</h2>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Employee, Lab Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="table-container">
          <Table>
            <TableHeader className="bg-sky-600">
              <TableRow>
                <TableHead className="text-white font-bold">SERIAL NO</TableHead>
                <TableHead className="text-white font-bold">EMP NO</TableHead>
                <TableHead className="text-white font-bold">EMP NAME</TableHead>
                <TableHead className="text-white font-bold">BOOK NO</TableHead>
                <TableHead className="text-white font-bold">LABORATORY</TableHead>
                <TableHead className="text-white font-bold">VISIT DATE</TableHead>
                <TableHead className="text-white font-bold">TOTAL AMOUNT</TableHead>
                <TableHead className="text-white font-bold">CYCLE</TableHead>
                <TableHead className="text-white font-bold text-center">QR</TableHead>
                <TableHead className="text-white font-bold text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingRecords ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Loading records...</TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-sky-400 italic">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record, index) => {
                  const total = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((sum, i) => {
                    const price = record[`Price${i}` as keyof TreatmentRecord];
                    return sum + (typeof price === 'number' ? price : 0);
                  }, 0);

                  const tests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .map(i => record[`Medicine${i}` as keyof TreatmentRecord])
                    .filter(m => m && m !== '')
                    .join(', ');

                  return (
                    <motion.tr
                      key={record.Serial_no}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-sky-50 transition-colors"
                    >
                      <TableCell className="font-bold text-sky-700">{record.Serial_no}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{record.Emp_no || 'N/A'}</TableCell>
                      <TableCell className="font-bold text-sky-900">{record.Emp_name}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{record.Book_no || '-'}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{record.Lab_name || '-'}</TableCell>
                      <TableCell className="text-slate-500">{new Date(record.Visit_Date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-sky-700">PKR {total.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded font-bold">
                          {record.Cycle_no} / {record.Allow_month}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {record.Qr_code && (
                          <img src={record.Qr_code} alt="QR" className="w-10 h-10 mx-auto border border-sky-100 rounded" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <PDFDownloadLink
                            document={<TreatmentSlip data={record} />}
                            fileName={`LabSlip_${record.Serial_no}.pdf`}
                          >
                            <Button variant="ghost" size="icon" className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 h-8 w-8">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </PDFDownloadLink>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Laboratory;
