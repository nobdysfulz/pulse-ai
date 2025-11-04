
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, Edit, Trash2, Search, ArrowUpDown, Users, User as UserIcon, MoreVertical, Activity, UserCog, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import EditUserModal from './EditUserModal';
import UserAutopilotManager from './UserAutopilotManager'; // Assuming this component can be passed user and manages its own visibility or opens a modal

// Modified StatCard to handle optional icon prop
const StatCard = ({ title, value, icon: Icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {Icon && <Icon className="h-4 w-4 text-slate-500" />} {/* Conditionally render icon */}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function UserManagementTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'descending' });
    const [stats, setStats] = useState({ total: 0, subscriber: 0, free: 0, admin: 0 });
    const [chartData, setChartData] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [managingAutopilotUser, setManagingAutopilotUser] = useState(null); // New state for Autopilot Manager

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await supabase.functions.invoke('adminOperations', {
                body: { operation: 'getAllUsers' }
            });
            
            if (response.status !== 200) {
                throw new Error('Failed to fetch users');
            }

            // The outline suggests response.data.users instead of response.data directly.
            const usersArray = Array.isArray(response.data?.users) ? response.data.users : [];
            setUsers(usersArray);
            
            // Calculate stats
            const total = usersArray.length;
            const subscriber = usersArray.filter(u => u.subscriptionTier === 'Subscriber').length;
            const admin = usersArray.filter(u => u.role === 'admin').length;
            // A user is 'Free' if their tier is not 'Subscriber' or 'Admin' (which is a tier, not a role in this context for enum)
            const free = usersArray.filter(u => u.subscriptionTier !== 'Subscriber' && u.subscriptionTier !== 'Admin').length;

            setStats({ total, subscriber, free, admin });
            setChartData([
                { name: 'Free', count: free },
                { name: 'Subscriber', count: subscriber },
                { name: 'Admin', count: admin },
            ]);
            
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Failed to load user list.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedUsers = React.useMemo(() => {
        let sortableUsers = [...users];
        if (searchTerm) {
            sortableUsers = sortableUsers.filter(user =>
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig.key) {
            sortableUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || aValue === null) return sortConfig.direction === 'ascending' ? 1 : -1;
                if (bValue === undefined || bValue === null) return sortConfig.direction === 'ascending' ? -1 : 1;

                // Specific handling for dates if needed, otherwise string/number comparison is fine.
                // Assuming created_date is already Date objects or sortable strings.
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, searchTerm, sortConfig]);

    const handleImpersonateUser = (user) => {
        // SECURITY: Impersonation feature has been disabled for security reasons
        // Client-side impersonation via sessionStorage is a critical security vulnerability
        // To re-enable, implement server-side impersonation with:
        // 1. Edge function to create secure impersonation tokens
        // 2. Server-side admin validation
        // 3. Database-stored impersonation state with expiration
        // 4. Audit logging of all impersonation attempts
        toast.error('Impersonation feature is currently disabled for security reasons.');
    };
    
    const handleUpdateUser = async (userId, payload) => {
        try {
            const { data } = await supabase.functions.invoke('adminEntityCRUD', {
                body: {
                    entityName: 'User',
                    operation: 'update',
                    id: userId,
                    payload
                }
            });

            if (data.success) {
                toast.success("User updated successfully!");
                await loadUsers();
            } else {
                throw new Error(data.error || "Update failed");
            }
        } catch (error) {
            console.error("Failed to update user:", error);
            toast.error(`Failed to update user: ${error.message}`);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) return;

        try {
            const { data } = await supabase.functions.invoke('adminEntityCRUD', {
                body: {
                    entityName: 'User',
                    operation: 'delete',
                    id: user.id
                }
            });

            if (data.success) {
                toast.success("User deleted successfully!");
                await loadUsers();
            } else {
                throw new Error(data.error || "Deletion failed");
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast.error(`Failed to delete user: ${error.message}`);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    const handleViewAutopilot = (user) => {
        setManagingAutopilotUser(user);
    };

    const getOnboardingStatusBadge = (user) => {
        // Check if user has completed core onboarding
        const coreComplete = user.onboarding?.onboardingCompleted || false;
        const agentComplete = user.onboarding?.agentOnboardingCompleted || false;
        const callCenterComplete = user.onboarding?.callCenterOnboardingCompleted || false;
        
        const isSubscriber = user.subscriptionTier === 'Subscriber' || user.subscriptionTier === 'Admin';
        // Assuming userAgentSubscription is part of user object and has status
        const hasCallCenter = user.userAgentSubscription && user.userAgentSubscription.status === 'active';
    
        // Determine what's needed
        if (!coreComplete) {
          return <Badge variant="destructive" className="text-xs">Core Incomplete</Badge>;
        }
        
        if (isSubscriber && !agentComplete) {
          return <Badge className="bg-yellow-500 text-xs hover:bg-yellow-500">Agent Setup Needed</Badge>;
        }
        
        if (hasCallCenter && !callCenterComplete) {
          return <Badge className="bg-orange-500 text-xs hover:bg-orange-500">Call Center Setup Needed</Badge>;
        }
    
        return <Badge className="bg-green-600 text-xs hover:bg-green-600">Complete</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats.total} icon={Users} />
                <StatCard title="Subscribers" value={stats.subscriber} icon={UserPlus} />
                <StatCard title="Free Users" value={stats.free} icon={UserIcon} />
                <StatCard title="Admins" value={stats.admin} icon={Edit} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Count</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: 'rgba(238, 242, 255, 0.5)'}} contentStyle={{fontSize: 12, padding: '4px 8px'}}/>
                            <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead onClick={() => handleSort('firstName')} className="cursor-pointer">User <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                            <TableHead onClick={() => handleSort('email')} className="cursor-pointer">Email <ArrowUpDown className="inline h-3 w-3" /></TableHead> {/* New column */}
                            <TableHead onClick={() => handleSort('subscriptionTier')} className="cursor-pointer">Tier <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                            <TableHead onClick={() => handleSort('subscriptionStatus')} className="cursor-pointer">Status <ArrowUpDown className="inline h-3 w-3" /></TableHead> {/* New column */}
                            <TableHead>Onboarding</TableHead> {/* New column */}
                            <TableHead onClick={() => handleSort('created_date')} className="cursor-pointer">Joined <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center"><Loader2 className="animate-spin mx-auto my-4" /></TableCell></TableRow>
                        ) : (
                            filteredAndSortedUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <img src={user.avatar || user.avatar_url || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} alt="avatar" className="w-8 h-8 rounded-full" />
                                            <div>
                                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell> {/* New Email Cell */}
                                    <TableCell>
                                        <Badge variant={user.subscriptionTier === 'Admin' ? 'default' : 'secondary'}>
                                            {user.subscriptionTier || 'Free'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell> {/* New Status Cell */}
                                        <Badge 
                                            variant={
                                                user.subscriptionStatus === 'active' ? 'default' :
                                                user.subscriptionStatus === 'past_due' ? 'destructive' :
                                                'secondary'
                                            }
                                        >
                                            {user.subscriptionStatus || 'active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell> {/* New Onboarding Cell */}
                                        {getOnboardingStatusBadge(user)}
                                    </TableCell>
                                    <TableCell>{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleViewAutopilot(user)}>
                                                    <Activity className="mr-2 h-4 w-4" />
                                                    Autopilot Activity
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleImpersonateUser(user)}>
                                                    <UserCog className="mr-2 h-4 w-4" />
                                                    Impersonate
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    user={editingUser}
                    onSave={handleUpdateUser}
                />
            )}
            {managingAutopilotUser && (
                // Assuming UserAutopilotManager can function as a modal or has an internal modal trigger.
                // If UserAutopilotManager is just content, it would need to be wrapped in a generic Modal component.
                // For this implementation, we assume UserAutopilotManager handles its own visibility/modal when passed a user.
                <UserAutopilotManager
                    user={managingAutopilotUser}
                    isOpen={!!managingAutopilotUser} // Pass isOpen prop
                    onClose={() => setManagingAutopilotUser(null)} // Pass onClose prop
                />
            )}
        </div>
    );
}
