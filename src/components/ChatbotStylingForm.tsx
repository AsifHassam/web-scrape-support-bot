
import { useState } from "react";
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
import { Save } from "lucide-react";

const formSchema = z.object({
  botName: z.string().min(1, "Bot name is required"),
  companyName: z.string().min(1, "Company name is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex code"),
});

interface ChatbotStylingFormProps {
  initialValues: {
    botName: string;
    companyName: string;
    primaryColor: string;
  };
  onSave: (values: z.infer<typeof formSchema>) => void;
}

const ChatbotStylingForm = ({ initialValues, onSave }: ChatbotStylingFormProps) => {
  const [colorPickerValue, setColorPickerValue] = useState(initialValues.primaryColor);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColorPickerValue(newColor);
    form.setValue("primaryColor", newColor);
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

        <Button type="submit" className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Styling
        </Button>
      </form>
    </Form>
  );
};

export default ChatbotStylingForm;
