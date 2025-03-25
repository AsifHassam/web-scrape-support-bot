
import { MessageSquare } from "lucide-react";

const EmptyConversationState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-6">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No conversation selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Select a conversation from the list to view messages
        </p>
      </div>
    </div>
  );
};

export default EmptyConversationState;
