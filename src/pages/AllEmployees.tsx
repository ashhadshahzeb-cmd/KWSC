import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Download, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldCustomizer } from "@/components/admin/FieldCustomizer";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : undefined) || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

interface Employee {
    emp_no: string;
    emp_name: string;
    nic?: string;
    department?: string;
    designation?: string;
    date_of_birth?: string;
    date_of_joining?: string;
    status?: string;
    gender?: string;
    phone?: string;
    address?: string;
}

const AllEmployees = () => {
    const { toast } = useToast();
    const { isAdmin } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const limit = 20;

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: (page * limit).toString(),
            });
            if (searchTerm) params.append('search', searchTerm);

            const res = await fetch(`${API_BASE}/employees?${params}`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setEmployees(data.employees || []);
                setTotal(data.total || 0);
            } else {
                toast({ title: "Error", description: data.error || "Failed to fetch employees", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchEmployees();
    };

    const exportToCSV = () => {
        const headers = ["Emp No", "Name", "NIC", "Department", "Designation", "DOB", "DOJ", "Status"];
        const csvContent = [
            headers.join(","),
            ...employees.map(emp => [
                emp.emp_no,
                `"${emp.emp_name || ''}"`,
                emp.nic || '',
                emp.department || '',
                emp.designation || '',
                emp.date_of_birth || '',
                emp.date_of_joining || '',
                emp.status || ''
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Employees exported to CSV" });
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">All Employees</h1>
                        <p className="text-muted-foreground">Total: {total} registered employees</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchEmployees()} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={exportToCSV} disabled={employees.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    {isAdmin && <FieldCustomizer moduleName="AllEmployees" />}
                </div>
            </motion.div>

            {/* Search */}
            <Card className="p-4">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, employee number, or NIC..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-bold">Emp No</TableHead>
                            <TableHead className="font-bold">Name</TableHead>
                            <TableHead className="font-bold">NIC</TableHead>
                            <TableHead className="font-bold">Department</TableHead>
                            <TableHead className="font-bold">Designation</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        Loading employees...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp) => (
                                <TableRow key={emp.emp_no} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-bold text-primary">{emp.emp_no}</TableCell>
                                    <TableCell className="font-medium">{emp.emp_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{emp.nic || '-'}</TableCell>
                                    <TableCell>{emp.department || '-'}</TableCell>
                                    <TableCell>{emp.designation || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === 'Active'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {emp.status || 'Active'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setSelectedEmployee(emp)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Employee Detail Dialog */}
            <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Employee Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Employee No</p>
                                <p className="font-bold text-lg text-primary">{selectedEmployee.emp_no}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{selectedEmployee.emp_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">NIC</p>
                                <p className="font-medium">{selectedEmployee.nic || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Gender</p>
                                <p className="font-medium">{selectedEmployee.gender || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="font-medium">{selectedEmployee.department || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Designation</p>
                                <p className="font-medium">{selectedEmployee.designation || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Date of Birth</p>
                                <p className="font-medium">{selectedEmployee.date_of_birth ? new Date(selectedEmployee.date_of_birth).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Date of Joining</p>
                                <p className="font-medium">{selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{selectedEmployee.address || '-'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{selectedEmployee.phone || '-'}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AllEmployees;
