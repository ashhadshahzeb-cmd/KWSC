import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Download, Eye, Trash2, QrCode, CreditCard, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { FieldCustomizer } from "@/components/admin/FieldCustomizer";
import { useRFID } from "@/hooks/useRFID";
import { sqlApi } from "@/lib/api";

interface Patient {
  id: string;
  empNo: string;
  name: string;
  bookNo: string;
  cnic: string;
  phone: string;
  visitDate: string;
  treatment: string;
  patientType: string;
  cardNo?: string;
  rfid_tag?: string;
  custom_fields?: Record<string, string>;
}

const Patients = () => {
  const { toast } = useToast();
  const { customFields, isAdmin } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPatients();
    loadLabTests();
  }, []);

  const [labTests, setLabTests] = useState<string[]>([]);

  const loadLabTests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/lab/tests');
      if (res.ok) {
        const data = await res.json();
        setLabTests(data);
      }
    } catch (error) {
      console.error("Failed to load lab tests", error);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await sqlApi.patients.getAll();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients", error);
    }
  };

  // RFID States
  const [isLinkingCard, setIsLinkingCard] = useState(false);
  const [patientToLink, setPatientToLink] = useState<Patient | null>(null);
  const [recentlyScannedPatient, setRecentlyScannedPatient] = useState<Patient | null>(null);

  const patientCustomFields = customFields.filter(f => f.module_name === "Patients");

  const [formData, setFormData] = useState({
    empNo: "",
    name: "",
    bookNo: "",
    cnic: "",
    phone: "",
    visitDate: new Date().toISOString().split('T')[0],
    treatment: "",
    patientType: "Self",
    custom_fields: {} as Record<string, string>,
  });

  // Global RFID Handler (for lookup)
  useRFID({
    enabled: !isLinkingCard && !isAddDialogOpen,
    onScan: async (tag) => {
      toast({
        title: "Scanning Card...",
        description: `Looking up patient with tag: ${tag}`,
      });
      try {
        const patientData = await sqlApi.patients.getByRFID(tag);
        toast({
          title: "Patient Found!",
          description: `Loaded record for: ${patientData.Name || "Unknown"}`,
          variant: "default",
          className: "bg-green-50 border-green-200"
        });
        setSearchTerm(patientData.Name || "");
      } catch (error) {
        toast({
          title: "Scan Failed",
          description: "No patient found with this card.",
          variant: "destructive",
        });
      }
    }
  });

  // Link Card Handler
  useRFID({
    enabled: isLinkingCard,
    onScan: async (tag) => {
      if (!patientToLink) return;

      try {
        await sqlApi.patients.linkRFID(parseInt(patientToLink.id), tag);

        // Update local state
        setPatients(prev => prev.map(p => p.id === patientToLink.id ? { ...p, rfid_tag: tag } : p));

        toast({
          title: "Card Linked!",
          description: `Successfully linked card to ${patientToLink.name}`,
          className: "bg-green-50 border-green-200"
        });
        setIsLinkingCard(false);
        setPatientToLink(null);
      } catch (err: any) {
        toast({
          title: "Link Failed",
          description: err.message,
          variant: "destructive"
        });
      }
    }
  });

  const filteredPatients = patients.filter(
    (patient) =>
      patient.empNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.bookNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmpNoBlur = async () => {
    if (!formData.empNo) return;

    try {
      // Validate cycle returns employee details
      const response = await sqlApi.treatment.validateCycle(formData.empNo);

      if (response && response.employee) {
        const { employee } = response;
        setFormData(prev => ({
          ...prev,
          name: employee.name || "",
          bookNo: employee.bookNo || "",
          cnic: employee.patientNic || "",
          // If phone is available in employee, use it, otherwise keep existing
          // But usually we want to fetch fresh data. If phone isn't in validateCycle, we might need another call or update validateCycle.
          // For now, let's assume validateCycle returns what we need or we map what we have.
          // Note: validateCycle returns: id, empNo, name, bookNo, patientNic, patientType, cardNo
          patientType: employee.patientType || "Self",
          cardNo: employee.cardNo || "",
        }));

        toast({
          title: "Employee Found",
          description: `Loaded details for ${employee.name}`,
        });
      }
    } catch (error) {
      console.error("Auto-fill failed", error);
      // Optional: don't toast error on blur to avoid annoyance if just clicking away
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sqlApi.patients.create(formData);
      await loadPatients();
      setFormData({
        empNo: "",
        name: "",
        bookNo: "",
        cnic: "",
        phone: "",
        visitDate: new Date().toISOString().split('T')[0],
        treatment: "",
        patientType: "Self",
        custom_fields: {},
        cardNo: "",
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Patient Registered",
        description: `${formData.name} has been successfully registered.`,
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
    toast({
      title: "Patient Deleted",
      description: "Patient record has been removed.",
      variant: "destructive",
    });
  };

  const generateQRData = (patient: Patient) => {
    return JSON.stringify({
      id: patient.empNo,
      name: patient.name,
      date: patient.visitDate,
    });
  };

  const downloadQRCode = () => {
    if (!selectedPatient) return;
    const svg = document.getElementById("qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${selectedPatient.empNo}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Patient Management</h1>
          <p className="text-muted-foreground">Register and manage patient records</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && <FieldCustomizer moduleName="Patients" />}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Register New Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empNo">Employee No *</Label>
                    <Input
                      id="empNo"
                      value={formData.empNo}
                      onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                      onBlur={handleEmpNoBlur}
                      placeholder="EMP001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookNo">Book No</Label>
                    <Input
                      id="bookNo"
                      value={formData.bookNo}
                      onChange={(e) => setFormData({ ...formData, bookNo: e.target.value })}
                      placeholder="BK001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                      id="cnic"
                      value={formData.cnic}
                      onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                      placeholder="35201-1234567-8"
                    />
                  </div>
                  {(formData as any).cardNo && (
                    <div className="space-y-2">
                      <Label htmlFor="cardNo" className="text-sky-600 font-bold">Medical Card No</Label>
                      <Input
                        id="cardNo"
                        value={(formData as any).cardNo}
                        readOnly
                        className="bg-sky-50 border-sky-200 text-sky-700 font-bold"
                      />
                    </div>
                  )}
                  {formData.cardNo && (
                    <div className="space-y-2">
                      <Label htmlFor="cardNo" className="text-sky-600 font-bold">Medical Card No</Label>
                      <Input
                        id="cardNo"
                        value={formData.cardNo}
                        readOnly
                        className="bg-sky-50 border-sky-200 text-sky-700 font-bold"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0300-1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitDate">Visit Date *</Label>
                    <Input
                      id="visitDate"
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatment">Treatment Type *</Label>
                    <Select
                      value={formData.treatment}
                      onValueChange={(value) => setFormData({ ...formData, treatment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Checkup">General Checkup</SelectItem>
                        <SelectItem value="Dental">Dental</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                        <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.treatment === "Laboratory" && (
                    <div className="space-y-2">
                      <Label htmlFor="labTest">Lab Test *</Label>
                      <Input
                        id="labTest"
                        list="lab-tests-list"
                        value={formData.custom_fields?.['Lab Test'] || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_fields: { ...formData.custom_fields, 'Lab Test': e.target.value }
                        })}
                        placeholder="Select or type test name"
                      />
                      <datalist id="lab-tests-list">
                        {labTests.map((test, i) => (
                          <option key={i} value={test} />
                        ))}
                      </datalist>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="patientType">Patient Type *</Label>
                    <Select
                      value={formData.patientType}
                      onValueChange={(value) => setFormData({ ...formData, patientType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Dynamic Fields */}
                  {patientCustomFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.field_name}>{field.label} {field.is_required && "*"}</Label>
                      <Input
                        id={field.field_name}
                        type={field.field_type}
                        value={formData.custom_fields?.[field.field_name] || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_fields: { ...formData.custom_fields, [field.field_name]: e.target.value }
                        })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.is_required}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Patient</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="medical-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Employee No, Name, Book No, or scan RFID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Book No</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Visit Date</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>RF-Card</TableHead>
              {patientCustomFields.map(f => (
                <TableHead key={f.id}>{f.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient, index) => (
              <motion.tr
                key={patient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <TableCell className="font-medium">{patient.empNo}</TableCell>
                <TableCell>{patient.name}</TableCell>
                <TableCell>{patient.bookNo}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.visitDate}</TableCell>
                <TableCell>{patient.treatment}</TableCell>
                <TableCell>
                  <Badge variant={patient.patientType === "Self" ? "default" : "secondary"}>
                    {patient.patientType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {patient.rfid_tag ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Linked</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">No Card</span>
                    )}
                  </div>
                </TableCell>
                {patientCustomFields.map(f => (
                  <TableCell key={f.id}>{patient.custom_fields?.[f.field_name] || "-"}</TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Link RF-Card"
                      onClick={() => {
                        setPatientToLink(patient);
                        setIsLinkingCard(true);
                      }}
                      className={patient.rfid_tag ? "text-emerald-600" : "text-muted-foreground"}
                    >
                      <CreditCard className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowQRDialog(true);
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(patient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Patient QR Code</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG
                  id="qr-code"
                  value={generateQRData(selectedPatient)}
                  size={200}
                  level="H"
                />
              </div>
              <div className="text-center">
                <p className="font-medium">{selectedPatient.name}</p>
                <p className="text-sm text-muted-foreground">{selectedPatient.empNo}</p>
              </div>
              <Button onClick={downloadQRCode} className="gap-2">
                <Download className="w-4 h-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RF Card Linking Dialog */}
      <Dialog open={isLinkingCard} onOpenChange={(open) => {
        setIsLinkingCard(open);
        if (!open) setPatientToLink(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Link RF-Card</DialogTitle>
            <DialogDescription>
              Scan an RFID card now to link it to {patientToLink?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary/10 p-6 rounded-full">
                <ScanLine className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>
            <p className="font-bold text-center animate-pulse">Waiting for scan...</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkingCard(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
