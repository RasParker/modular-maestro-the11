import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, Flag, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Reports: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    return matchesStatus && matchesType && matchesPriority;
  });

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setReports(reports.map(report => 
          report.id === parseInt(reportId) 
            ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
            : report
        ));
        toast({
          title: "Report status updated",
          description: `Report has been marked as ${newStatus}.`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report status.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (reportId: string) => {
    // Navigate to report details page
    // For now, show a toast notification
    toast({
      title: "Report Details",
      description: `Viewing details for report ${reportId}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'under_review':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="mb-4 w-10 h-10 p-0 sm:w-auto sm:h-auto sm:p-2 sm:px-4">
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Flag className="w-8 h-8 text-primary" />
            Reports Management
          </h1>
          <p className="text-muted-foreground">
            View and manage user reports and violations
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                Export Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Platform Reports ({filteredReports.length})</CardTitle>
            <CardDescription>Manage reports and violations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                <div key={report.id} className="p-6 rounded-lg border border-border/50 bg-muted/10">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground truncate">{report.reason}</h3>
                        <Badge variant="outline" className="capitalize shrink-0">
                          {report.type}
                        </Badge>
                        <Badge variant={getPriorityColor(report.priority) as any} className="capitalize shrink-0">
                          {report.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 break-words">{report.description}</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Reported by:</span>
                          <span className="ml-2 font-medium truncate">{report.reported_by}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Target:</span>
                          <span className="ml-2 font-medium truncate">{report.target}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2 text-xs">{new Date(report.created_at).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Updated:</span>
                          <span className="ml-2 text-xs">{new Date(report.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end lg:justify-start shrink-0">
                      <Badge variant={
                        report.status === 'pending' ? 'destructive' :
                        report.status === 'under_review' ? 'secondary' : 'default'
                      } className="flex items-center gap-1 whitespace-nowrap">
                        {getStatusIcon(report.status)}
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {report.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(report.id, 'under_review')}
                      >
                        Start Review
                      </Button>
                    )}
                    {report.status === 'under_review' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(report.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};