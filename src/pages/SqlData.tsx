import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Users, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { sqlApi } from "@/lib/api";

const SqlData = () => {
    const [tables, setTables] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tablesData, patientsData] = await Promise.all([
                sqlApi.getTables(),
                sqlApi.getPatients()
            ]);
            setTables(tablesData);
            setPatients(patientsData);
        } catch (error: any) {
            toast.error("Failed to load data from SQL Server", {
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            await sqlApi.addPatient(formData);
            toast.success("Patient added successfully to SQL Server");
            setFormData({ name: "", phone: "" });
            loadData();
        } catch (error: any) {
            toast.error("Failed to add patient", {
                description: error.message
            });
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">SQL Server Data</h1>
                    <p className="text-muted-foreground">Direct connection to Medical database</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tables List */}
                <Card className="lg:col-span-1 glass-card border-none shadow-xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-xl font-display flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            Database Tables
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableBody>
                                    {tables.map((table, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium py-3 px-6">{table.name}</TableCell>
                                        </TableRow>
                                    ))}
                                    {tables.length === 0 && (
                                        <TableRow>
                                            <TableCell className="text-center py-8 text-muted-foreground">No tables found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Patients List & Add Form */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Add Form */}
                    <Card className="glass-card border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-display flex items-center gap-2">
                                <Plus className="w-5 h-5 text-success" />
                                Add New Patient (SQL Server)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddPatient} className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="Enter phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" className="w-full sm:w-auto px-8" disabled={adding}>
                                        {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Add
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Patients Table */}
                    <Card className="glass-card border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-info/5 border-b border-info/10">
                            <CardTitle className="text-xl font-display flex items-center gap-2">
                                <Users className="w-5 h-5 text-info" />
                                Recent Patients (Last 50)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="table-container border-none shadow-none rounded-none">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[80px]">ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patients.map((patient) => (
                                            <TableRow key={patient.Id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-bold text-primary/70">{patient.Id}</TableCell>
                                                <TableCell className="font-medium">{patient.Name}</TableCell>
                                                <TableCell className="text-muted-foreground">{patient.Phone}</TableCell>
                                            </TableRow>
                                        ))}
                                        {patients.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-12">
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <AlertCircle className="w-8 h-8 opacity-20" />
                                                        <p>No patient records found in SQL Server</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SqlData;
