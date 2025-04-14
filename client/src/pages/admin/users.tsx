import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { User } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Search, Filter, MoreHorizontal, ChevronDown, 
  Check, X, Edit, Eye, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false
  });

  // Approve writer mutation
  const approveWriterMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}/approve`, { status: 'approved' });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Writer Approved',
        description: 'The writer has been approved successfully.',
      });
      setIsApproveDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve writer.',
        variant: 'destructive',
      });
    }
  });

  // Reject writer mutation
  const rejectWriterMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}/approve`, { status: 'rejected' });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Writer Rejected',
        description: 'The writer has been rejected.',
      });
      setIsRejectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject writer.',
        variant: 'destructive',
      });
    }
  });

  // Filter users
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        user.id.toString().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      // Apply role filter
      const matchesRole = roleFilter === null || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);
  
  // Calculate pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle viewing user details
  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsViewDetailsOpen(true);
  };

  // Handle approval
  const handleApproveWriter = (user: User) => {
    setSelectedUser(user);
    setIsApproveDialogOpen(true);
  };

  // Handle rejection
  const handleRejectWriter = (user: User) => {
    setSelectedUser(user);
    setIsRejectDialogOpen(true);
  };

  // Get role badge style
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{role}</Badge>;
      case 'writer':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{role}</Badge>;
      case 'client':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{role}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Get approval status badge
  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateStr: Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-500 mt-1">Manage platform users and their permissions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                {roleFilter ? roleFilter : 'All roles'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRoleFilter(null)}>
                All roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('admin')}>
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('writer')}>
                Writer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('client')}>
                Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Users table */}
        <div className="border rounded-md">
          <Table>
            <TableCaption>List of all platform users.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.role === 'writer' ? 
                        getApprovalBadge(user.approvalStatus || 'pending') : 
                        '-'}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUserDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>
                          {user.role === 'writer' && user.approvalStatus === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleApproveWriter(user)}
                                className="text-green-600"
                              >
                                <Check className="mr-2 h-4 w-4" /> Approve writer
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRejectWriter(user)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" /> Reject writer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View User Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">User ID:</div>
              <div className="col-span-3">{selectedUser?.id}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Username:</div>
              <div className="col-span-3">{selectedUser?.username}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Full Name:</div>
              <div className="col-span-3">{selectedUser?.fullName || '-'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Email:</div>
              <div className="col-span-3">{selectedUser?.email || '-'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Role:</div>
              <div className="col-span-3">{getRoleBadge(selectedUser?.role || '')}</div>
            </div>
            {selectedUser?.role === 'writer' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Status:</div>
                <div className="col-span-3">
                  {getApprovalBadge(selectedUser.approvalStatus || 'pending')}
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Balance:</div>
              <div className="col-span-3">${selectedUser?.balance?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Created:</div>
              <div className="col-span-3">
                {selectedUser && formatDate(selectedUser.createdAt)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Writer Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Writer</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedUser?.username} as a writer?
              This will allow them to bid on jobs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={approveWriterMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => selectedUser && approveWriterMutation.mutate(selectedUser.id)}
              disabled={approveWriterMutation.isPending}
            >
              {approveWriterMutation.isPending ? "Approving..." : "Yes, Approve Writer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Writer Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Writer</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedUser?.username} as a writer?
              They will not be able to bid on jobs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={rejectWriterMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedUser && rejectWriterMutation.mutate(selectedUser.id)}
              disabled={rejectWriterMutation.isPending}
            >
              {rejectWriterMutation.isPending ? "Rejecting..." : "Yes, Reject Writer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}