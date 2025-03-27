
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfDay, subDays, format, eachDayOfInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface AnalyticsData {
  date: string;
  chats: number;
  visitors: number;
}

interface BotAnalyticsRecord {
  id: string;
  bot_id: string;
  date: string;
  chat_count: number;
  unique_visitors: number;
  created_at: string;
  updated_at: string;
}

interface BotAnalyticsProps {
  botId: string;
}

const BotAnalytics = ({ botId }: BotAnalyticsProps) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate;
      
      switch(period) {
        case 'day':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = subDays(now, 1);
      }
      
      // Format dates for Supabase query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = now.toISOString();
      
      // Get raw analytics data
      const { data, error } = await supabase
        .from('bot_analytics')
        .select('*')
        .eq('bot_id', botId)
        .gte('date', formattedStartDate.split('T')[0])
        .lte('date', formattedEndDate.split('T')[0])
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      // Cast the data to the correct type
      const typedData = data as unknown as BotAnalyticsRecord[];
      
      // Generate date intervals
      const dates = eachDayOfInterval({
        start: startDate,
        end: now
      });
      
      // Map data to intervals
      const mappedData: AnalyticsData[] = dates.map(date => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const dayData = typedData?.find(item => item.date === formattedDate);
        
        return {
          date: format(date, 'MMM dd'),
          chats: dayData?.chat_count || 0,
          visitors: dayData?.unique_visitors || 0
        };
      });
      
      setAnalyticsData(mappedData);
      
      // Calculate totals
      const totals = typedData?.reduce((acc, curr) => {
        return {
          chats: acc.chats + (curr.chat_count || 0),
          visitors: acc.visitors + (curr.unique_visitors || 0)
        };
      }, { chats: 0, visitors: 0 });
      
      setTotalChats(totals?.chats || 0);
      setTotalVisitors(totals?.visitors || 0);
      
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalytics();
  }, [botId, period]);
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };
  
  // Dummy data for demo purposes (if no real data is available)
  const demoData = [
    { date: 'Jan 01', chats: 2, visitors: 1 },
    { date: 'Jan 02', chats: 4, visitors: 2 },
    { date: 'Jan 03', chats: 3, visitors: 3 },
    { date: 'Jan 04', chats: 8, visitors: 5 },
    { date: 'Jan 05', chats: 10, visitors: 6 },
    { date: 'Jan 06', chats: 7, visitors: 4 },
    { date: 'Jan 07', chats: 12, visitors: 8 },
  ];
  
  const data = analyticsData.length > 0 ? analyticsData : demoData;
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="day" onValueChange={(value) => setPeriod(value as 'day' | 'week' | 'month')}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Bot Analytics</h2>
          <TabsList>
            <TabsTrigger value="day">24H</TabsTrigger>
            <TabsTrigger value="week">7 Days</TabsTrigger>
            <TabsTrigger value="month">30 Days</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Chats</CardDescription>
              <CardTitle className="text-3xl">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalChats}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Visitors</CardDescription>
              <CardTitle className="text-3xl">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalVisitors}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Chats Per User</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                 totalVisitors > 0 ? (totalChats / totalVisitors).toFixed(1) : "0.0"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Chat conversations and visitors over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="chats" stroke="#8884d8" fillOpacity={1} fill="url(#colorChats)" />
                  <Area type="monotone" dataKey="visitors" stroke="#82ca9d" fillOpacity={1} fill="url(#colorVisitors)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default BotAnalytics;
