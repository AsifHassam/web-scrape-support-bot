
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreditCard, Loader2 } from "lucide-react";

const formSchema = z.object({
  cardNumber: z
    .string()
    .min(13, { message: "Card number must be at least 13 digits" })
    .max(19, { message: "Card number must not exceed 19 digits" })
    .regex(/^\d+$/, { message: "Card number must contain only digits" }),
  cardholderName: z.string().min(3, { message: "Cardholder name is required" }),
  expiryMonth: z
    .string()
    .min(1, { message: "Required" })
    .max(2, { message: "Invalid month" })
    .refine((val) => {
      const month = parseInt(val, 10);
      return month >= 1 && month <= 12;
    }, { message: "Month must be between 1-12" }),
  expiryYear: z
    .string()
    .min(2, { message: "Required" })
    .max(4, { message: "Invalid year" })
    .refine((val) => {
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return year >= currentYear && year <= currentYear + 20;
    }, { message: "Invalid year" }),
  cvv: z
    .string()
    .min(3, { message: "CVV must be 3-4 digits" })
    .max(4, { message: "CVV must be 3-4 digits" })
    .regex(/^\d+$/, { message: "CVV must contain only digits" }),
  makeDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newMethod: any) => void;
}

const UpdatePaymentDialog = ({ open, onOpenChange, onSuccess }: UpdatePaymentDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      makeDefault: true,
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, you would send the card details to a payment
      // processor like Stripe and only store a token or the last 4 digits
      
      // For demo purposes, we'll simulate a successful payment method addition
      const last_four = values.cardNumber.slice(-4);
      const card_type = getCardType(values.cardNumber);
      
      const { data, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          provider: "demo", // This would be your payment processor in production
          last_four,
          card_type,
          exp_month: parseInt(values.expiryMonth, 10),
          exp_year: parseInt(values.expiryYear, 10),
          is_default: values.makeDefault,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update user metadata
      await supabase
        .from("users_metadata")
        .update({ has_payment_method: true })
        .eq("id", user.id);
      
      // Call the success callback
      if (data) {
        onSuccess(data);
      }
      
      // Reset the form and close the dialog
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding payment method:", error.message);
      toast.error("Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };
  
  // Simple card type detection based on first digits
  const getCardType = (cardNumber: string): string => {
    const firstDigit = cardNumber.charAt(0);
    const firstTwoDigits = cardNumber.substring(0, 2);
    
    if (firstDigit === "4") return "Visa";
    if (firstTwoDigits >= "51" && firstTwoDigits <= "55") return "MasterCard";
    if (firstTwoDigits === "34" || firstTwoDigits === "37") return "American Express";
    if (firstTwoDigits === "65" || firstTwoDigits === "62") return "Discover";
    
    return "Credit Card";
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Enter your card details to add a new payment method.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      {...field}
                      maxLength={19}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="expiryMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MM"
                        {...field}
                        maxLength={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="YYYY"
                        {...field}
                        maxLength={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123"
                        {...field}
                        maxLength={4}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePaymentDialog;
