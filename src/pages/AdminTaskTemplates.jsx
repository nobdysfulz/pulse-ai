import React, { useState, useEffect, useMemo } from 'react';
import { TaskTemplate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, MoreVertical, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import TaskTemplateForm from '../components/admin/TaskTemplateForm';

const AdminTaskTemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await TaskTemplate.list();
            setTemplates(data);
        } catch (error) {
            toast.error('Failed to load task templates.');
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleCreate = () => {
        setSelectedTemplate({ isActive: true, priority: 'medium', pulseImpact: 0.1 });
        setIsModalOpen(true);
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await TaskTemplate.delete(id);
            toast.success('Template deleted successfully.');
            loadTemplates();
        } catch (error) {
            toast.error('Failed to delete template.');
            console.error(error);
        }
    };

    const handleSave = async () => {
        try {
            if (selectedTemplate.id) {
                await TaskTemplate.update(selectedTemplate.id, selectedTemplate);
                toast.success('Template updated successfully.');
            } else {
                await TaskTemplate.create(selectedTemplate);
                toast.success('Template created successfully.');
            }
            setIsModalOpen(false);
            setSelectedTemplate(null);
            loadTemplates();
        } catch (error) {
            toast.error('Failed to save template.');
            console.error(error);
        }
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const searchMatch = searchTerm === '' || 
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.description.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
            return searchMatch && categoryMatch;
        });
    }, [templates, searchTerm, categoryFilter]);

    const categoryOptions = [...new Set(templates.map(t => t.category))];

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Task Template Management</h1>
                        <p className="text-slate-600">Manage the templates used for daily action generation.</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                    </Button>
                </header>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                            </div>
                             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Trigger</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTemplates.map(template => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.title}</TableCell>
                                        <TableCell><Badge variant="outline">{template.category.replace(/_/g, ' ')}</Badge></TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {template.triggerType.replace(/_/g, ' ')}: <span className="font-mono bg-slate-100 px-1 rounded">{template.triggerValue}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={template.isActive ? 'default' : 'destructive'} className={template.isActive ? 'bg-green-100 text-green-800' : ''}>
                                                {template.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEdit(template)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <TaskTemplateForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                template={selectedTemplate}
                setTemplate={setSelectedTemplate}
            />
        </div>
    );
};

export default AdminTaskTemplatesPage;