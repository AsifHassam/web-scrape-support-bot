
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FileText, Download, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";

type Invoice = {
  id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  payment_date: string | null;
  description: string | null;
};

const InvoiceList = ({ userId }: { userId?: string }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", userId)
          .order("invoice_date", { ascending: false });
          
        if (error) throw error;
        
        setInvoices(data || []);
      } catch (error: any) {
        console.error("Error fetching invoices:", error.message);
        toast.error("Failed to load invoice history");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, [userId]);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }
  
  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Invoices</h3>
        <p className="text-gray-500 dark:text-gray-400">
          You don't have any invoices yet. They will appear here once available.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.invoice_number || `INV-${invoice.id.substring(0, 8)}`}
                {invoice.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.description}</p>
                )}
              </TableCell>
              <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
              <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceList;
