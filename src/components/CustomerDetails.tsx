
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, Mail, Phone, ExternalLink } from "lucide-react";

interface Conversation {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_location?: string;
}

interface CustomerDetailsProps {
  conversation: Conversation;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ conversation }) => {
  const initials = conversation.customer_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();
  
  // For demo purposes, we'll add some mock details
  // In a real app, these would come from the conversation object
  const customerDetails = {
    firstName: conversation.customer_name.split(' ')[0] || 'Unknown',
    lastName: conversation.customer_name.split(' ').slice(1).join(' ') || '',
    email: conversation.customer_email || 'No email provided',
    phone: conversation.customer_phone || '+27 73 179 9394',
    location: conversation.customer_location || 'Unknown',
    whatsapp: '+27 73 179 9394',
    notes: '',
    profile: conversation.customer_name.split(' ')[0] || 'Unknown',
    channel: 'Website Chat',
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="text-center mb-6">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold">{conversation.customer_name}</h2>
          <a 
            href="#" 
            className="text-sm text-primary flex items-center justify-center mt-1"
          >
            Open contact detail page
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              FIRST NAME
            </h3>
            <p className="text-base">{customerDetails.firstName}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              LAST NAME
            </h3>
            <p className="text-base">{customerDetails.lastName}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              EMAIL
            </h3>
            <p className="text-base flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              {customerDetails.email}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              PHONE NUMBER
            </h3>
            <p className="text-base flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              {customerDetails.phone}
            </p>
          </div>
          
          {customerDetails.whatsapp && (
            <div>
              <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                WHATSAPP
              </h3>
              <p className="text-base">{customerDetails.whatsapp}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              NOTES
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 min-h-24">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {customerDetails.notes || 'No notes available'}
              </p>
              <p className="text-xs text-right mt-2 text-gray-400">
                Only visible to agents
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              PROFILE
            </h3>
            <p className="text-base">{customerDetails.profile}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              CHANNEL
            </h3>
            <p className="text-base">{customerDetails.channel}</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default CustomerDetails;
