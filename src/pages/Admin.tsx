
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { 
  User, 
  Users, 
  UserPlus, 
  UserX, 
  Edit, 
  Trash, 
  Check, 
  Ban,
  CreditCard,
  Search
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  payment_status: 'FREE' | 'PAID' | 'TRIAL';
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

type FormValues = z.infer<typeof formSchema>;

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real app, you'd use a Supabase admin API or function to get users.
      // For this demo, we'll simulate some users
      const mockUsers: UserData[] = [
        {
          id: "1",
          email: "user1@example.com",
          created_at: "2023-01-01T12:00:00Z",
          last_sign_in_at: "2023-03-15T09:30:00Z",
          status: "ACTIVE",
          payment_status: "PAID"
        },
        {
          id: "2",
          email: "user2@example.com",
          created_at: "2023-02-15T14:30:00Z",
          last_sign_in_at: null,
          status: "ACTIVE",
          payment_status: "FREE"
        },
        {
          id: "3",
          email: "user3@example.com",
          created_at: "2023-03-10T10:15:00Z",
          last_sign_in_at: "2023-03-12T16:45:00Z",
          status: "BLOCKED",
          payment_status: "TRIAL"
        }
      ];
      
      setUsers(mockUsers);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (data: FormValues) => {
    try {
      toast.success(`User added: ${data.email}`);
      // In a real app, you'd use Supabase admin API to create the user
      setOpenAddDialog(false);
      form.reset();
      // Refetch users
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to add user: " + error.message);
    }
  };

  const handleBlockUser = async (userId: string, currentStatus: 'ACTIVE' | 'BLOCKED') => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      const actionText = newStatus === 'BLOCKED' ? 'blocked' : 'unblocked';
      
      // Update local state for immediate UI feedback
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      toast.success(`User ${actionText} successfully`);
    } catch (error: any) {
      toast.error(`Failed to ${currentStatus === 'ACTIVE' ? 'block' : 'unblock'} user: ${error.message}`);
      // Revert the local change on failure
      fetchUsers();
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real app, you'd use Supabase admin API to delete the user
      
      // Update local state for immediate UI feedback
      setUsers(users.filter(user => user.id !== selectedUser.id));
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

  const updatePaymentStatus = async (userId: string, newStatus: 'FREE' | 'PAID' | 'TRIAL') => {
    try {
      // Update local state for immediate UI feedback
      setUsers(users.map(user => 
        user.id === userId ? { ...user, payment_status: newStatus } : user
      ));
      
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error("Failed to update payment status: " + error.message);
      // Revert the local change on failure
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="user@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit">Add User</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString() 
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="relative inline-block text-left">
                            <select
                              value={user.payment_status}
                              onChange={(e) => updatePaymentStatus(
                                user.id, 
                                e.target.value as 'FREE' | 'PAID' | 'TRIAL'
                              )}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-2"
                            >
                              <option value="FREE">FREE</option>
                              <option value="TRIAL">TRIAL</option>
                              <option value="PAID">PAID</option>
                            </select>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlockUser(user.id, user.status)}
                            >
                              {user.status === 'ACTIVE' ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
