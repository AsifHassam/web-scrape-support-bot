
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from "@/lib/types/billing";

const formSchema = z.object({
  botName: z.string().min(1, "Bot name is required"),
  companyName: z.string().min(1, "Company name is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex code"),
  showPoweredBy: z.boolean().optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex code").optional(),
  fontFamily: z.string().optional(),
  welcomeMessage: z.string().optional(),
  customCSS: z.string().optional(),
});

interface ChatbotStylingFormProps {
  initialValues: {
    botName: string;
    companyName: string;
    primaryColor: string;
    showPoweredBy?: boolean;
    accentColor?: string;
    fontFamily?: string;
    welcomeMessage?: string;
    customCSS?: string;
  };
  onSave: (values: z.infer<typeof formSchema>) => void;
}

const ChatbotStylingForm = ({ initialValues, onSave }: ChatbotStylingFormProps) => {
  const [colorPickerValue, setColorPickerValue] = useState(initialValues.primaryColor);
  const [accentColorValue, setAccentColorValue] = useState(initialValues.accentColor || "#f3f4f6");
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("TRIAL");
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("users_metadata")
          .select("payment_status")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        
        const status = data.payment_status.toUpperCase();
        if (status === 'PAID' || status === 'PRO') {
          setSubscriptionTier('PRO');
        } else if (status === 'STARTER') {
          setSubscriptionTier('STARTER');
        } else if (status === 'ENTERPRISE') {
          setSubscriptionTier('ENTERPRISE');
        } else {
          setSubscriptionTier('TRIAL');
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscriptionTier('TRIAL');
      }
    };
    
    fetchUserSubscription();
  }, [user]);

  const canCustomize = subscriptionTier === 'PRO' || subscriptionTier === 'ENTERPRISE';
  const limits = SUBSCRIPTION_LIMITS[subscriptionTier];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialValues,
      showPoweredBy: initialValues.showPoweredBy !== undefined 
        ? initialValues.showPoweredBy 
        : limits.showPoweredBy,
    },
  });
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColorPickerValue(newColor);
    form.setValue("primaryColor", newColor);
  };
  
  const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setAccentColorValue(newColor);
    form.setValue("accentColor", newColor);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="botName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bot Name</FormLabel>
              <FormControl>
                <Input placeholder="AI Assistant" {...field} />
              </FormControl>
              <FormDescription>
                This is how your chatbot will introduce itself to users.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Company" {...field} />
              </FormControl>
              <FormDescription>
                Your company or organization name shown in the chat header.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Color</FormLabel>
              <div className="flex items-center space-x-4">
                <FormControl>
                  <Input 
                    placeholder="#3b82f6" 
                    {...field} 
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setColorPickerValue(e.target.value);
                    }}
                  />
                </FormControl>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={colorPickerValue}
                    onChange={handleColorChange}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                  <div 
                    className="w-8 h-8 rounded-full border border-gray-200" 
                    style={{ backgroundColor: field.value }}
                  />
                </div>
              </div>
              <FormDescription>
                The main color used for your chatbot's header and buttons.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {canCustomize ? (
          <>
            <FormField
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <div className="flex items-center space-x-4">
                    <FormControl>
                      <Input 
                        placeholder="#f3f4f6" 
                        {...field} 
                        value={field.value || "#f3f4f6"}
                        onChange={(e) => {
                          field.onChange(e);
                          setAccentColorValue(e.target.value);
                        }}
                      />
                    </FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        value={accentColorValue}
                        onChange={handleAccentColorChange}
                        className="w-10 h-10 p-1 cursor-pointer"
                      />
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-200" 
                        style={{ backgroundColor: field.value || "#f3f4f6" }}
                      />
                    </div>
                  </div>
                  <FormDescription>
                    Secondary color used for accents and highlights.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fontFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Family</FormLabel>
                  <FormControl>
                    <Input placeholder="Inter, system-ui, sans-serif" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Custom font for your chatbot (use web-safe fonts or include font files in your website).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Hello! How can I help you today?" 
                      className="min-h-[100px]"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom welcome message shown when the chat first opens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customCSS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom CSS</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder=".chatbot-container { border-radius: 12px; }" 
                      className="min-h-[120px] font-mono text-sm"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Advanced: Add custom CSS to further style your chatbot.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="showPoweredBy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show "Powered by Chatwise"</FormLabel>
                    <FormDescription>
                      Display the "Powered by Chatwise" text in the chatbot footer.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        ) : (
          <>
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                Upgrade to Pro plan to access advanced customization options like custom CSS, fonts, and branding.
              </AlertDescription>
            </Alert>
            
            <FormField
              control={form.control}
              name="showPoweredBy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 opacity-60">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show "Powered by Chatwise"</FormLabel>
                    <FormDescription>
                      Available with the Pro plan - upgrade to remove the "Powered by Chatwise" text.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={true}
                      disabled={true}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Styling
        </Button>
      </form>
    </Form>
  );
};

export default ChatbotStylingForm;
