
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/api/entities'; // Assuming User entity is from this path
import { UserCredit } from '@/api/entities'; // Assuming UserCredit entity is from this path
import { Search, Edit, Save, X, UserCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminUsers } from '@/api/functions';

export default function SubscriptionManager() {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading for fetching all users

    // Effect to fetch all admin users on component mount
    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                const response = await getAdminUsers();
                if (response.data && Array.isArray(response.data.users)) {
                    setAllUsers(response.data.users);
                } else {
                    toast.error("Failed to fetch user list. Response format incorrect.");
                    setAllUsers([]);
                }
            } catch (error) {
                console.error('Error fetching all users:', error);
                toast.error('Failed to load user data.');
                setAllUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAllUsers();
    }, []);

    // Effect to filter users based on search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredUsers([]);
            return;
        }

        if (allUsers.length > 0) {
            const searchLower = searchTerm.toLowerCase();
            const results = allUsers.filter(user =>
                user.email?.toLowerCase().includes(searchLower) ||
                user.full_name?.toLowerCase().includes(searchLower) ||
                user.firstName?.toLowerCase().includes(searchLower) ||
                user.lastName?.toLowerCase().includes(searchLower)
            );
            setFilteredUsers(results);
        }
    }, [searchTerm, allUsers]);


    const handleUpdateSubscription = async (userId, newTier) => {
        setLoading(true); // Set loading for the update operation
        try {
            await User.update(userId, { subscriptionTier: newTier });

            const creditAllocation = newTier === 'Subscriber' ? 200 : (newTier === 'Admin' ? 9999 : 25);

            try {
                const userObject = allUsers.find(u => u.id === userId);
                // Ensure userObject is found and has an email before trying to filter UserCredit
                if (userObject?.email) {
                    const userCredits = await UserCredit.filter({ created_by: userObject.email }, '-created_date', 1);

                    if (userCredits.length > 0) {
                        await UserCredit.update(userCredits[0].id, {
                            creditsRemaining: creditAllocation,
                            resetDate: new Date().toISOString().split('T')[0]
                        });
                    } else {
                         await UserCredit.create({
                            userId: userId,
                            creditsRemaining: creditAllocation,
                            creditsUsed: 0,
                            resetDate: new Date().toISOString().split('T')[0]
                        });
                    }
                } else {
                    console.warn(`User object or email not found for userId: ${userId}. Skipping credit update.`);
                }
            } catch (creditError) {
                console.warn('Could not update user credits:', creditError);
                toast.warning('Subscription updated, but failed to set credits.');
            }

            const updatedAllUsers = allUsers.map(user =>
                user.id === userId
                    ? { ...user, subscriptionTier: newTier }
                    : user
            );
            setAllUsers(updatedAllUsers);

            // Also update the filtered users list if the updated user is present
            setFilteredUsers(prevFilteredUsers => prevFilteredUsers.map(user =>
                user.id === userId
                    ? { ...user, subscriptionTier: newTier }
                    : user
            ));


            setEditingUser(null);
            toast.success(`Successfully updated user subscription to ${newTier}`);

        } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error('Failed to update subscription. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (user) => {
        setEditingUser({ ...user, newTier: user.subscriptionTier || 'Free' });
    };

    const cancelEditing = () => {
        setEditingUser(null);
    };

    const saveChanges = () => {
        if (editingUser && editingUser.newTier !== editingUser.subscriptionTier) {
            handleUpdateSubscription(editingUser.id, editingUser.newTier);
        } else {
            setEditingUser(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCog className="w-5 h-5 text-purple-600" />
                    Subscription Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search for a user by email, name or full name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {loading && !allUsers.length ? (
                    <div className="text-center py-4 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-slate-600">Loading All Users...</span>
                    </div>
                ) : searchTerm.length < 3 && !loading ? (
                    <div className="text-center py-8 text-slate-500">
                        Type at least 3 characters to search for users
                    </div>
                ) : filteredUsers.length === 0 && searchTerm.length >= 3 ? (
                    <div className="text-center py-8 text-slate-500">
                        No users found matching "{searchTerm}"
                    </div>
                ) : (filteredUsers.length > 0 &&
                    <div className="space-y-3">
                        <h3 className="font-medium text-slate-900">Search Results ({filteredUsers.length})</h3>
                        <div className="space-y-2">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                                                {(user.firstName?.[0] || user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {user.firstName && user.lastName
                                                        ? `${user.firstName} ${user.lastName}`
                                                        : user.full_name || 'Unknown User'
                                                    }
                                                </p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {editingUser?.id === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={editingUser.newTier}
                                                    onValueChange={(value) => setEditingUser({ ...editingUser, newTier: value })}
                                                >
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Free">Free</SelectItem>
                                                        <SelectItem value="Subscriber">Subscriber</SelectItem>
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="icon"
                                                    onClick={saveChanges}
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={cancelEditing}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={user.subscriptionTier === 'Subscriber' ? 'default' : user.subscriptionTier === 'Admin' ? 'destructive' : 'secondary'}
                                                    className={user.subscriptionTier === 'Subscriber' ? 'bg-green-500' : ''}
                                                >
                                                    {user.subscriptionTier || 'Free'}
                                                </Badge>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => startEditing(user)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
