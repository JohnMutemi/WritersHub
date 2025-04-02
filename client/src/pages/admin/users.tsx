import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false
  });

  // Approve writer mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Writer approved',
        description: 'The writer has been approved successfully.',
      });
      setShowDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to approve writer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject writer mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/reject`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Writer rejected',
        description: 'The writer has been rejected.',
      });
      setShowDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to reject writer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'writer':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'client':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getApprovalBadgeColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDialog(true);
  };

  const formatDate = (timestamp: Date) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Button>Export Users</Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users?.length === 0 ? (
              <div className="text-center py-8">No users found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Writer Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'writer' && (
                          <Badge className={getApprovalBadgeColor(user.approvalStatus)}>
                            {user.approvalStatus || 'N/A'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>${user.balance.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* User detail dialog */}
        {selectedUser && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>User ID: {selectedUser.id}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Username</div>
                  <div>{selectedUser.username}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Email</div>
                  <div>{selectedUser.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Role</div>
                  <div>
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
                {selectedUser.role === 'writer' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Writer Status</div>
                    <div>
                      <Badge className={getApprovalBadgeColor(selectedUser.approvalStatus)}>
                        {selectedUser.approvalStatus || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Balance</div>
                  <div>${selectedUser.balance.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Joined</div>
                  <div>{formatDate(selectedUser.createdAt)}</div>
                </div>
              </div>
              <DialogFooter>
                {selectedUser.role === 'writer' && selectedUser.approvalStatus === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="bg-red-100 hover:bg-red-200 text-red-800"
                      onClick={() => rejectMutation.mutate(selectedUser.id)}
                      disabled={rejectMutation.isPending}
                    >
                      Reject Writer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-green-100 hover:bg-green-200 text-green-800"
                      onClick={() => approveMutation.mutate(selectedUser.id)}
                      disabled={approveMutation.isPending}
                    >
                      Approve Writer
                    </Button>
                  </>
                )}
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}