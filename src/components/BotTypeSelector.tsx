
import { useState } from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { GraduationCap, Heart, Headphones, Wrench, ShoppingCart, Users, Bot, ExternalLink, Pencil } from 'lucide-react';

type BotType = 
  | 'educational' 
  | 'health' 
  | 'customer_support' 
  | 'it_support' 
  | 'ecommerce' 
  | 'hr' 
  | 'personal' 
  | 'lead_generation' 
  | 'other';

interface BotTypeOption {
  value: BotType;
  label: string;
  icon: React.ReactNode;
}

interface BotTypeSelectorProps {
  value: BotType | '';
  onChange: (value: BotType) => void;
}

const BotTypeSelector = ({ value, onChange }: BotTypeSelectorProps) => {
  const botTypes: BotTypeOption[] = [
    { value: 'educational', label: 'Educational assistant', icon: <GraduationCap className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'health', label: 'Health assistant', icon: <Heart className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'customer_support', label: 'Customer support', icon: <Headphones className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'it_support', label: 'IT support', icon: <Wrench className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'ecommerce', label: 'E-Commerce', icon: <ShoppingCart className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'hr', label: 'HR', icon: <Users className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'personal', label: 'Personal assistant', icon: <Bot className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'lead_generation', label: 'Lead generation', icon: <ExternalLink className="h-10 w-10 mx-auto mb-2" /> },
    { value: 'other', label: 'Other', icon: <Pencil className="h-10 w-10 mx-auto mb-2" /> },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base">What type of AI agent are you building?</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {botTypes.map((type) => (
          <div
            key={type.value}
            className={`
              p-4 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer border-2 transition-all
              ${value === type.value ? 'border-primary' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}
            `}
            onClick={() => onChange(type.value)}
          >
            {type.icon}
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium mr-2">
                {type.value === 'educational' ? 'A' :
                 type.value === 'health' ? 'B' :
                 type.value === 'customer_support' ? 'C' :
                 type.value === 'it_support' ? 'D' :
                 type.value === 'ecommerce' ? 'E' :
                 type.value === 'hr' ? 'F' :
                 type.value === 'personal' ? 'G' :
                 type.value === 'lead_generation' ? 'H' : 'I'}
              </span>
              {type.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotTypeSelector;
