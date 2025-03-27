
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import InvoiceList from "./InvoiceList";
import PaymentMethodCard from "./PaymentMethodCard";
import UpdatePaymentDialog from "./UpdatePaymentDialog";

type Subscription = {
  id: string;
  plan_name: string;
  price: number;
  billing_cycle: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
};

type PaymentMethod = {
  id: string;
  provider: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
};

const BillingTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("subscription");

  useEffect(() => {
    if (!user) return;
    
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        
        // Fetch active subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        if (subError && subError.code !== "PGRST116") {
          console.error("Error fetching subscription:", subError);
          toast.error("Failed to load subscription data");
        }
        
        if (subData) {
          setSubscription(subData);
        }
        
        // Fetch payment methods
        const { data: paymentData, error: paymentError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });
          
        if (paymentError) {
          console.error("Error fetching payment methods:", paymentError);
          toast.error("Failed to load payment methods");
        }
        
        if (paymentData) {
          setPaymentMethods(paymentData);
        }
      } catch (error: any) {
        console.error("Error in fetchBillingData:", error.message);
        toast.error("An error occurred while loading billing data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBillingData();
  }, [user]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "trialing":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "past_due":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "canceled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getCycleText = (cycle: string) => {
    return cycle === "monthly" ? "Monthly" : "Annual";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>
          Manage your subscription, payment methods, and view billing history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="w-full mb-8">
            <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
            <TabsTrigger value="payment-methods" className="flex-1">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices" className="flex-1">Invoices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : subscription ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{subscription.plan_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getCycleText(subscription.billing_cycle)} billing
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(subscription.status)}
                    <span className="capitalize">{subscription.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(subscription.price)} / {subscription.billing_cycle === "monthly" ? "month" : "year"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Renewal Date</p>
                    <p className="font-medium">
                      {subscription.end_date ? formatDate(subscription.end_date) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Started On</p>
                    <p className="font-medium">{formatDate(subscription.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Auto Renewal</p>
                    <p className="font-medium">{subscription.auto_renew ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Cancel Subscription</Button>
                  <Button>Change Plan</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  You don't have an active subscription. Subscribe to a plan to get started.
                </p>
                <Button>View Plans</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="payment-methods">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard key={method.id} paymentMethod={method} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      You haven't added any payment methods yet.
                    </p>
                  </div>
                )}
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setDialogOpen(true)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {paymentMethods.length > 0 ? "Add New Payment Method" : "Add Payment Method"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invoices">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <InvoiceList userId={user?.id} />
            )}
          </TabsContent>
        </Tabs>
        
        <UpdatePaymentDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSuccess={(newMethod) => {
            setPaymentMethods([...paymentMethods, newMethod]);
            toast.success("Payment method added successfully");
          }}
        />
      </CardContent>
    </Card>
  );
};

export default BillingTab;
