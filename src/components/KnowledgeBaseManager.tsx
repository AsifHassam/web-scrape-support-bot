
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Globe, FileText, Plus, Trash2 } from "lucide-react";

interface KnowledgeSource {
  id: string;
  bot_id: string;
  source_type: string;
  content: string;
  created_at: string;
}

interface KnowledgeBaseManagerProps {
  botId: string;
}

const KnowledgeBaseManager = ({ botId }: KnowledgeBaseManagerProps) => {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSource, setAddingSource] = useState(false);
  
  const form = useForm({
    defaultValues: {
      sourceType: "text",
      content: "",
      url: "",
    }
  });
  
  const fetchKnowledgeSources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("knowledge_sources")
        .select("*")
        .eq("bot_id", botId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setKnowledgeSources(data || []);
    } catch (error: any) {
      console.error("Error fetching knowledge sources:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge sources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchKnowledgeSources();
  }, [botId]);
  
  const handleAddSource = async (values: any) => {
    try {
      const sourceData = {
        bot_id: botId,
        source_type: values.sourceType,
        content: values.sourceType === "text" ? values.content : values.url,
      };
      
      const { error } = await supabase
        .from("knowledge_sources")
        .insert(sourceData);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Knowledge source added successfully",
      });
      
      // Reset form and refresh
      form.reset();
      setAddingSource(false);
      fetchKnowledgeSources();
    } catch (error: any) {
      console.error("Error adding knowledge source:", error);
      toast({
        title: "Error",
        description: "Failed to add knowledge source",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from("knowledge_sources")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Knowledge source deleted successfully",
      });
      
      // Refresh the list
      fetchKnowledgeSources();
    } catch (error: any) {
      console.error("Error deleting knowledge source:", error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge source",
        variant: "destructive",
      });
    }
  };
  
  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case "url":
      case "website":
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Manage the knowledge sources that train your chatbot
              </CardDescription>
            </div>
            <Badge variant="outline">
              {knowledgeSources.length} {knowledgeSources.length === 1 ? 'Source' : 'Sources'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500 dark:text-gray-400">Loading knowledge sources...</p>
            </div>
          ) : knowledgeSources.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No knowledge sources have been added yet.</p>
              <Button onClick={() => setAddingSource(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Knowledge
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-4">
                  {knowledgeSources.map((source) => (
                    <div key={source.id} className="flex items-start justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 bg-primary/10 p-2 rounded-full text-primary">
                          {getSourceTypeIcon(source.source_type)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {source.source_type === "text" ? "Text Input" : 
                             source.source_type === "url" ? "Website URL" :
                             source.source_type}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {source.content}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Added {new Date(source.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSource(source.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setAddingSource(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              </div>
            </>
          )}
          
          {addingSource && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Add Knowledge Source</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSource)} className="space-y-4">
                  <Tabs value={form.watch("sourceType")} onValueChange={(value) => form.setValue("sourceType", value)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="url">Website URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="space-y-4 mt-4">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter text knowledge..." 
                                className="h-32"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Paste or type text content to add to your bot's knowledge
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4 mt-4">
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter a website URL to scrape for knowledge
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setAddingSource(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Source</Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseManager;
