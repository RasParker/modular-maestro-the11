import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCard } from '@/components/admin/UserCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  joined: string;
  subscribers: number;
  revenue: number;
  avatar?: string;
}

export const ManageUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const allUsers = await response.json();

      // Transform users to match the User interface
      const transformedUsers: User[] = allUsers.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || 'active', // Use status from DB or default to active
        joined: new Date(user.created_at).toISOString().split('T')[0],
        subscribers: user.total_subscribers || 0,
        revenue: parseFloat(user.total_earnings || '0'),
        avatar: user.avatar
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    // Apply tab filtering
    let matchesTab = true;
    if (activeTab === 'creators') {
      matchesTab = user.role === 'creator';
    } else if (activeTab === 'fans') {
      matchesTab = user.role === 'fan';
    } else if (activeTab === 'banned') {
      matchesTab = user.status === 'suspended';
    }
    // 'all' tab shows all users, so no additional filtering needed

    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  const handleSuspendUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const newStatus = user?.status === 'suspended' ? 'active' : 'suspended';

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, status: newStatus }
            : user
        )
      );
    } catch (error) {
      console.error('Failed to suspend/activate user:', error);
    }
  };

    const getCreators = () => {
        return users.filter(user => user.role === 'creator');
    };

    const getFans = () => {
        return users.filter(user => user.role === 'fan');
    };

    const getBannedUsers = () => {
        return users.filter(user => user.status === 'suspended');
    };

  return (
    <AppLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center sm:justify-start">
            Manage Users
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage platform users
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card border-border/50 mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="creator">Creators</SelectItem>
                  <SelectItem value="fan">Fans</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full sm:w-auto">
                Export Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-base sm:text-xl">Platform Users ({filteredUsers.length})</CardTitle>
            <CardDescription className="text-sm">Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
            <TabsList className="mb-6 mx-auto sm:mx-0">
              <TabsTrigger value="all" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}>
                All Users
                <span className="ml-2 text-xs opacity-70">
                  {users.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="creators" onClick={() => { setRoleFilter('creator'); setStatusFilter('all'); }}>
                Creators
                <span className="ml-2 text-xs opacity-70">
                  {getCreators().length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="fans" onClick={() => { setRoleFilter('fan'); setStatusFilter('all'); }}>
                Fans
                <span className="ml-2 text-xs opacity-70">
                  {getFans().length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="banned" onClick={() => { setRoleFilter('all'); setStatusFilter('suspended'); }}>
                Banned
                <span className="ml-2 text-xs opacity-70">
                  {getBannedUsers().length}
                </span>
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSuspendUser={handleSuspendUser}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No users found matching your criteria.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="creators" className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSuspendUser={handleSuspendUser}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No creators found matching your criteria.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="fans" className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSuspendUser={handleSuspendUser}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No fans found matching your criteria.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="banned" className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onSuspendUser={handleSuspendUser}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No suspended users found.
                    </p>
                  )}
                </TabsContent>
              </>
            )}
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>
    </AppLayout>
  );
};