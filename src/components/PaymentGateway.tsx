
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Check, DollarSign, Loader2 } from "lucide-react";

interface PaymentGatewayProps {
  botId: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

const PaymentGateway = ({ botId, onPaymentComplete, onCancel }: PaymentGatewayProps) => {
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "enterprise">("starter");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePayment = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would be a call to your payment processor
      // For now, we'll simulate a payment process with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the user's payment status in the database
      if (user) {
        const { error } = await supabase
          .from("users_metadata")
          .update({ payment_status: selectedPlan.toUpperCase() })
          .eq("id", user.id);
          
        if (error) throw error;
      }
      
      toast.success("Payment processed successfully!");
      onPaymentComplete();
    } catch (error: any) {
      toast.error("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$29",
      features: [
        "1,000 messages per month",
        "Email support",
        "Basic analytics",
        "1 team member",
        "Website integration"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: "$79",
      features: [
        "5,000 messages per month",
        "Priority email support",
        "Advanced analytics",
        "4 team members",
        "Custom branding",
        "Connect with Whatsapp & Instagram"
      ],
      recommended: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Contact Us",
      features: [
        "10,000+ messages per month",
        "24/7 priority support",
        "Enterprise analytics",
        "Unlimited team members",
        "Custom branding",
        "Dedicated account manager",
        "Custom integrations"
      ]
    }
  ];

  const handleFreeTrial = () => {
    toast.success("Free trial activated! You can upgrade later.");
    onPaymentComplete();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Choose a Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select a plan that suits your needs
        </p>
      </div>

      <RadioGroup
        value={selectedPlan}
        onValueChange={(value) => setSelectedPlan(value as "starter" | "pro" | "enterprise")}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {plans.map((plan) => (
          <div key={plan.id} className="relative">
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
            )}
            <Label
              htmlFor={plan.id}
              className={`h-full flex flex-col border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  selectedPlan === plan.id
                    ? "border-primary"
                    : "border-gray-300 dark:border-gray-600"
                }`}>
                  {selectedPlan === plan.id && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="mt-4 mb-2 text-xl font-bold">{plan.price}</div>
              <div className="mt-2 space-y-2 flex-grow">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-primary mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-3 mt-8">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" onClick={handleFreeTrial}>
            Start Free Trial
          </Button>
          <Button 
            disabled={loading} 
            onClick={handlePayment}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {loading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
