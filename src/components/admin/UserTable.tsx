
import React from "react";
import { Ban, Check, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  payment_status: 'TRIAL' | 'PAID' | 'STARTER' | 'PRO' | 'ENTERPRISE';
}

interface UserTableProps {
  users: UserData[];
  onBlockUser: (userId: string, status: 'ACTIVE' | 'BLOCKED') => void;
  onDeleteClick: (user: UserData) => void;
  updatePaymentStatus: (userId: string, newStatus: 'TRIAL' | 'PAID' | 'STARTER' | 'PRO' | 'ENTERPRISE') => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onBlockUser,
  onDeleteClick,
  updatePaymentStatus
}) => {
  return (
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
          {users.map((user) => (
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
                      e.target.value as 'TRIAL' | 'PAID' | 'STARTER' | 'PRO' | 'ENTERPRISE'
                    )}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-2"
                  >
                    <option value="TRIAL">TRIAL</option>
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBlockUser(user.id, user.status)}
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
                    onClick={() => onDeleteClick(user)}
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
  );
};

export default UserTable;
