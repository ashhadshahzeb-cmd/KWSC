import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Check, X, Search, UserPlus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { sqlApi } from "@/lib/api";
import ManageCardDialog from "@/components/admin/ManageCardDialog";

interface UserWithRole {
  id: string | number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [showCardDialog, setShowCardDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await sqlApi.users.getAll();
      const mappedUsers = data.map((u: any) => ({
        id: u.Id || u.id,
        email: u.Email || u.email,
        full_name: u.Full_name || u.full_name || u.Email,
        role: u.Role || u.role || "user",
        permissions: u.Permissions || [],
        has_medical_card: u.has_medical_card
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users from backend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    // Basic permissions for system components
    const basicPerms = [
      { id: '1', name: 'patients', description: 'Access to patient records' },
      { id: '2', name: 'medicine', description: 'Access to medicine/pharmacy' },
      { id: '3', name: 'hospital', description: 'Access to hospital records' },
      { id: '4', name: 'laboratory', description: 'Access to laboratory tests' },
      { id: '5', name: 'reports', description: 'Access to system reports' },
    ];
    setPermissions(basicPerms);
  };

  const handleRoleChange = async (userId: string | number, newRole: "admin" | "user") => {
    try {
      await sqlApi.users.updateRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({
        title: "Role Updated",
        description: `User role has been changed to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role in backend",
        variant: "destructive",
      });
    }
  };

  const openPermissionDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions);
    setShowPermissionDialog(true);
  };

  const togglePermission = (permissionName: string) => {
    setUserPermissions(prev =>
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    toast({
      title: "Coming Soon",
      description: "Permission management migration to SQL is in progress.",
    });
    setShowPermissionDialog(false);
  };

  const filteredUsers = users.filter(
    u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions (SQL Backend)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.role === "admin").length}
                </p>
                <p className="text-sm text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.role === "user").length}
                </p>
                <p className="text-sm text-muted-foreground">Regular Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="medical-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => (u as any).has_medical_card).length}
                </p>
                <p className="text-sm text-muted-foreground">Cards Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="medical-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Medical Card</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((userItem, index) => (
              <motion.tr
                key={userItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <TableCell className="font-medium">{userItem.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{userItem.email}</TableCell>
                <TableCell>
                  <Select
                    value={userItem.role}
                    onValueChange={(value) => handleRoleChange(userItem.id, value as "admin" | "user")}
                    disabled={userItem.email === user?.email}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {userItem.role === "admin" ? (
                    <Badge className="bg-success/10 text-success border-0">All Access</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {userItem.permissions.length > 0 ? (
                        userItem.permissions.slice(0, 2).map(p => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No permissions</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {userItem.has_medical_card ? (
                    <Badge className="bg-success/10 text-success border-success/30 gap-1.5 px-3">
                      <Check className="w-3.5 h-3.5" /> Issued
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground/60 gap-1.5 px-3 border-dashed">
                      <X className="w-3.5 h-3.5" /> Not Issued
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(userItem);
                        setShowCardDialog(true);
                      }}
                      className="gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </Button>
                    {userItem.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissionDialog(userItem)}
                      >
                        Permissions
                      </Button>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Manage Permissions</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium capitalize">{permission.name.replace("_", " ")}</p>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                    <Checkbox
                      checked={userPermissions.includes(permission.name)}
                      onCheckedChange={() => togglePermission(permission.name)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={savePermissions}>Save Permissions</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ManageCardDialog
        open={showCardDialog}
        onOpenChange={(open) => {
          setShowCardDialog(open);
          if (!open) fetchUsers(); // Refresh status after closing dialog
        }}
        user={selectedUser as any}
      />
    </div >
  );
};

export default UserManagement;
