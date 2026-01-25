import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Smartphone, Laptop, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  fingerprint: string;
  userName: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  approved: boolean;
  lastLogin: string;
  location: string;
}

const initialDevices: Device[] = [
  { id: "1", fingerprint: "abc123def456", userName: "Admin User", deviceType: "Desktop", browser: "Chrome 120", approved: true, lastLogin: "2024-01-15 10:30 AM", location: "Lahore, Pakistan" },
  { id: "2", fingerprint: "xyz789uvw012", userName: "Dr. Ahmed", deviceType: "Mobile", browser: "Safari 17", approved: true, lastLogin: "2024-01-15 09:15 AM", location: "Karachi, Pakistan" },
  { id: "3", fingerprint: "mno345pqr678", userName: "Receptionist", deviceType: "Desktop", browser: "Firefox 121", approved: false, lastLogin: "2024-01-15 08:45 AM", location: "Islamabad, Pakistan" },
  { id: "4", fingerprint: "stu901vwx234", userName: "Pharmacist", deviceType: "Tablet", browser: "Chrome 119", approved: false, lastLogin: "2024-01-14 04:30 PM", location: "Multan, Pakistan" },
];

const DeviceManagement = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  const handleApprove = (id: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, approved: true } : d));
    toast({
      title: "Device Approved",
      description: "The device has been approved and can now access the system.",
    });
  };

  const handleReject = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
    toast({
      title: "Device Rejected",
      description: "The device has been removed from the system.",
      variant: "destructive",
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Mobile":
        return <Smartphone className="w-4 h-4" />;
      case "Tablet":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  const pendingDevices = devices.filter(d => !d.approved);
  const approvedDevices = devices.filter(d => d.approved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Device Management</h1>
        <p className="text-muted-foreground">Manage and approve devices that can access the system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{approvedDevices.length}</p>
                <p className="text-sm text-muted-foreground">Approved Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingDevices.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval Section */}
      {pendingDevices.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Pending Device Approvals
            </CardTitle>
            <CardDescription>
              These devices are waiting for admin approval to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDevices.map((device, index) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {getDeviceIcon(device.deviceType)}
                    </div>
                    <div>
                      <p className="font-medium">{device.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.deviceType} • {device.browser} • {device.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleApprove(device.id)} className="gap-1">
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(device.id)} className="gap-1">
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Devices Table */}
      <div className="table-container">
        <div className="p-4 border-b">
          <h3 className="font-display font-semibold">All Registered Devices</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device, index) => (
              <motion.tr
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <TableCell className="font-medium">{device.userName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device.deviceType)}
                    {device.deviceType}
                  </div>
                </TableCell>
                <TableCell>{device.browser}</TableCell>
                <TableCell>{device.location}</TableCell>
                <TableCell>{device.lastLogin}</TableCell>
                <TableCell>
                  <Badge variant={device.approved ? "default" : "secondary"}>
                    {device.approved ? "Approved" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {device.approved ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleReject(device.id)}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleApprove(device.id)}
                    >
                      Approve
                    </Button>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeviceManagement;
