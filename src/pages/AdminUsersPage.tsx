import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Eye, EyeOff, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Profile, Category, UserCategoryAccess } from '@/types/types';

const categories: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];

const formatDob = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Category visibility state
  const [categoryAccess, setCategoryAccess] = useState<Map<string, UserCategoryAccess[]>>(new Map());
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedUserForCategory, setSelectedUserForCategory] = useState<Profile | null>(null);
  
  // Delete user state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
      setLoading(false);
      return;
    }

    setUsers(data || []);
    
    // Fetch category access for all users
    await fetchCategoryAccess(data || []);
    
    setLoading(false);
  };

  const fetchCategoryAccess = async (userList: Profile[]) => {
    const { data, error } = await supabase
      .from('user_category_access')
      .select('*');

    if (error) {
      console.error('Failed to fetch category access:', error);
      return;
    }

    // Group by user_id
    const accessMap = new Map<string, UserCategoryAccess[]>();
    (data || []).forEach((access) => {
      const existing = accessMap.get(access.user_id) || [];
      existing.push(access);
      accessMap.set(access.user_id, existing);
    });

    setCategoryAccess(accessMap);
  };

  const handleApprove = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', userId);

    if (error) {
      console.error('Failed to approve user:', error);
      toast.error('Failed to approve user');
      return;
    }

    toast.success('User approved successfully');
    fetchUsers();
  };

  const handleReject = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: false })
      .eq('id', userId);

    if (error) {
      console.error('Failed to reject user:', error);
      toast.error('Failed to reject user');
      return;
    }

    toast.success('User access revoked');
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id },
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
        setDeleting(false);
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to delete user');
        setDeleting(false);
        return;
      }

      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
    setDeleting(false);
  };

  const openDeleteDialog = (user: Profile) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const validateUsername = (value: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(value);
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error('Username and password are required');
      return;
    }

    if (!validateUsername(newUsername)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the User Agreement and Privacy Policy');
      return;
    }

    setCreating(true);

    try {
      console.log('=== Creating new user via edge function ===');
      console.log('Username:', newUsername);
      console.log('Email:', newEmail || 'Not provided');
      
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          username: newUsername,
          email: newEmail.trim() || null,
          password: newPassword,
        },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        const errorText = await error.context?.text?.() || error.message;
        console.error('Error details:', errorText);
        toast.error(`Failed to create user: ${errorText}`);
        setCreating(false);
        return;
      }
      
      console.log('Edge function response:', data);
      
      if (data.error) {
        console.error('User creation failed:', data.error);
        toast.error(data.error);
        setCreating(false);
        return;
      }
      
      if (data.success) {
        console.log('✓ User created successfully!');
        toast.success(`User "${newUsername}" created successfully!`);
        setNewUsername('');
        setNewPassword('');
        setNewEmail('');
        setAgreedToTerms(false);
        setIsCreateDialogOpen(false);
        
        // Refresh user list
        setTimeout(() => {
          fetchUsers();
        }, 500);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setCreating(false);
  };

  const openCategoryDialog = (user: Profile) => {
    setSelectedUserForCategory(user);
    setIsCategoryDialogOpen(true);
  };

  const getCategoryVisibility = (userId: string, category: Category): boolean => {
    const userAccess = categoryAccess.get(userId) || [];
    const access = userAccess.find(a => a.category === category);
    return access ? access.visible : true; // Default to visible if not set
  };

  const toggleCategoryVisibility = async (userId: string, category: Category, currentVisible: boolean) => {
    try {
      const newVisible = !currentVisible;
      
      // Check if record exists
      const userAccess = categoryAccess.get(userId) || [];
      const existingAccess = userAccess.find(a => a.category === category);

      if (existingAccess) {
        // Update existing record
        const { error } = await supabase
          .from('user_category_access')
          .update({ visible: newVisible })
          .eq('id', existingAccess.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_category_access')
          .insert({
            user_id: userId,
            category,
            visible: newVisible,
          });

        if (error) throw error;
      }

      toast.success(`${category} ${newVisible ? 'shown' : 'hidden'} for user`);
      
      // Refresh data
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling category visibility:', error);
      toast.error('Failed to update category visibility');
    }
  };

  if (profile?.role !== 'admin') return null;

  // Filter users by search
  const filterUser = (u: Profile) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.mobile_number ?? '').includes(q)
    );
  };

  const pendingUsers = users.filter((u) => !u.approved && u.role !== 'admin' && filterUser(u));
  const approvedUsers = users.filter((u) => (u.approved || u.role === 'admin') && filterUser(u));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-balance">User Management</h1>
                <p className="text-muted-foreground text-pretty">
                  Approve or reject user registrations, and create new user accounts
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account with username and password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Username</Label>
                      <Input
                        id="new-username"
                        placeholder="Enter username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="px-3"
                      />
                      <p className="text-xs text-muted-foreground">
                        Only letters, numbers, and underscores allowed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email (Optional)</Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="Enter email (optional)"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="px-3"
                      />
                      <p className="text-xs text-muted-foreground">
                        If not provided, will use {'{username}'}@miaoda.com
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="px-3"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="admin-terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <Label
                        htmlFor="admin-terms"
                        className="cursor-pointer text-sm leading-relaxed"
                      >
                        I agree to the User Agreement and Privacy Policy
                      </Label>
                    </div>
                    <Button onClick={handleCreateUser} disabled={creating} className="w-full">
                      {creating ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading users...</p>
          ) : (
            <div className="space-y-8">
              {/* Search box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Full Name, Username, or Mobile Number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 px-9"
                />
              </div>

              {/* Pending Users */}
              {pendingUsers.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-balance">
                    Pending Approval ({pendingUsers.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingUsers.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            {user.full_name && (
                              <p className="font-semibold">{user.full_name}</p>
                            )}
                            <p className="font-medium text-muted-foreground">@{user.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email || 'No email'}
                            </p>
                            {user.mobile_number && (
                              <p className="text-sm text-muted-foreground">
                                Mobile: {user.mobile_number}
                              </p>
                            )}
                            {user.date_of_birth && (
                              <p className="text-sm text-muted-foreground">
                                DOB: {formatDob(user.date_of_birth)}
                              </p>
                            )}
                            {user.temporary_password && (
                              <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                                Password: {user.temporary_password}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Registered: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              className="gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Users */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-balance">
                  Approved Users ({approvedUsers.length})
                </h2>
                <div className="space-y-3">
                  {approvedUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {user.full_name && (
                              <p className="font-semibold">{user.full_name}</p>
                            )}
                            {user.role === 'admin' && (
                              <Badge variant="default">Admin</Badge>
                            )}
                            {user.approved && user.role !== 'admin' && (
                              <Badge variant="secondary">Approved</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email || 'No email'}
                          </p>
                          {user.mobile_number && (
                            <p className="text-sm text-muted-foreground">
                              Mobile: {user.mobile_number}
                            </p>
                          )}
                          {user.date_of_birth && (
                            <p className="text-sm text-muted-foreground">
                              DOB: {formatDob(user.date_of_birth)}
                            </p>
                          )}
                          {user.temporary_password && (
                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                              Password: {user.temporary_password}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {user.role !== 'admin' && (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCategoryDialog(user)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Categories
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(user.id)}
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Revoke
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(user)}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {approvedUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No users match your search.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Category Visibility Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Category Visibility</DialogTitle>
            <DialogDescription>
              Control which categories {selectedUserForCategory?.username} can access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUserForCategory && categories.map((category) => {
              const isVisible = getCategoryVisibility(selectedUserForCategory.id, category);
              return (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {isVisible ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-xs text-muted-foreground">
                        {isVisible ? 'Visible to user' : 'Hidden from user'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isVisible ? 'outline' : 'default'}
                    onClick={() => toggleCategoryVisibility(selectedUserForCategory.id, category, isVisible)}
                  >
                    {isVisible ? 'Hide' : 'Show'}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <span className="font-semibold">{userToDelete?.username}</span>?
              This action cannot be undone. All quiz history and data for this user will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
