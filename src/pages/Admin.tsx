
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Components
import AdminHeader from "@/components/admin/AdminHeader";
import UserTable from "@/components/admin/UserTable";
import AddUserDialog from "@/components/admin/AddUserDialog";
import DeleteUserDialog from "@/components/admin/DeleteUserDialog";
import UserSearchBar from "@/components/admin/UserSearchBar";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  payment_status: 'FREE' | 'PAID' | 'TRIAL';
}

const Admin = () => {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log("Fetching users from user_profiles and users_metadata tables");
      
      // 1. Get user profile data
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, updated_at');
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Fetched profiles:", profilesData?.length || 0);
      
      // 2. Get user metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('users_metadata')
        .select('*');
      
      if (metadataError) {
        console.error("Error fetching metadata:", metadataError);
        throw metadataError;
      }
      
      console.log("Fetched metadata:", metadataData?.length || 0);
      
      // 3. Create a map of profiles by id for easy lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
      
      // 4. Combine profile data with metadata
      const combinedUsers: UserData[] = metadataData?.map(metadata => {
        const profile = profilesMap.get(metadata.id);
        
        return {
          id: metadata.id,
          email: profile?.display_name || `user-${metadata.id.substring(0, 8)}`,
          created_at: metadata.created_at,
          last_sign_in_at: profile?.updated_at || null,
          status: metadata.status as 'ACTIVE' | 'BLOCKED',
          payment_status: metadata.payment_status as 'FREE' | 'PAID' | 'TRIAL'
        };
      }) || [];
      
      console.log("Combined users data:", combinedUsers.length);
      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error in fetchUsers:", error);
      toast.error("Failed to fetch users: " + error.message);
      
      // Fallback to mock data if there's an error
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (data: { email: string; password: string }) => {
    try {
      // Instead of creating a user with admin API, use sign up
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(`User added: ${data.email}`);
      setOpenAddDialog(false);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to add user: " + error.message);
    }
  };

  const handleBlockUser = async (userId: string, currentStatus: 'ACTIVE' | 'BLOCKED') => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      const actionText = newStatus === 'BLOCKED' ? 'blocked' : 'unblocked';
      
      // Update the user status in users_metadata
      const { error } = await supabase
        .from('users_metadata')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      toast.success(`User ${actionText} successfully`);
    } catch (error: any) {
      toast.error(`Failed to ${currentStatus === 'ACTIVE' ? 'block' : 'unblock'} user: ${error.message}`);
      fetchUsers();
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Instead of directly deleting the user with admin API,
      // just delete from users_metadata which will be our source of truth
      const { error } = await supabase
        .from('users_metadata')
        .delete()
        .eq('id', selectedUser.id);
      
      if (error) {
        throw error;
      }
      
      setUsers(users.filter(user => user.id !== selectedUser.id));
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

  const updatePaymentStatus = async (userId: string, newStatus: 'FREE' | 'PAID' | 'TRIAL') => {
    try {
      // Update the payment status in users_metadata
      const { error } = await supabase
        .from('users_metadata')
        .update({ 
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, payment_status: newStatus } : user
      ));
      
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error("Failed to update payment status: " + error.message);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="Admin Dashboard" onSignOut={signOut} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <UserSearchBar 
                  searchTerm={searchTerm} 
                  onSearchChange={setSearchTerm} 
                />
                <AddUserDialog
                  open={openAddDialog}
                  onOpenChange={setOpenAddDialog}
                  onAddUser={handleAddUser}
                />
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
              <UserTable
                users={filteredUsers}
                onBlockUser={handleBlockUser}
                onDeleteClick={handleUserDeleteClick}
                updatePaymentStatus={updatePaymentStatus}
              />
            )}
          </div>
        </div>
      </main>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};

export default Admin;
