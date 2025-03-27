
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PaymentMethodProps = {
  paymentMethod: {
    id: string;
    provider: string;
    last_four: string;
    card_type: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
  };
};

const PaymentMethodCard = ({ paymentMethod }: PaymentMethodProps) => {
  const { card_type, last_four, exp_month, exp_year, is_default } = paymentMethod;
  
  // Format expiry date (MM/YY)
  const expiryDate = `${exp_month.toString().padStart(2, '0')}/${exp_year.toString().slice(-2)}`;
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <CreditCard className="h-8 w-8 mr-3 text-primary" />
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium">{card_type}</p>
              {is_default && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              •••• •••• •••• {last_four} | Expires {expiryDate}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!is_default && (
            <Button variant="outline" size="sm">
              Set Default
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodCard;
