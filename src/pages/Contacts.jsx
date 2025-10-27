
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../components/context/UserContext';
import { Contact } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactsPage() {
  const { user } = useContext(UserContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // FIX: Add activeTab state
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await Contact.list('-created_date');
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Filter contacts based on BOTH search/status AND activeTab
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      const matchesSearch = 
        !searchTerm ||
        contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === 'all' || contact.leadStatus === filterStatus;

      // Tab filter (FIX: Now activeTab actually filters the list)
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'hot' && contact.temperature === 'hot') ||
        (activeTab === 'warm' && contact.temperature === 'warm') ||
        (activeTab === 'cold' && contact.temperature === 'cold') ||
        (activeTab === 'new' && contact.leadStatus === 'new');

      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [contacts, searchTerm, filterStatus, activeTab]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with tabs */}
      <div className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#1E293B]">Contacts</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => {
                setActiveTab('all');
                setSearchTerm(''); // Clear search on tab change for simplicity
                setFilterStatus('all'); // Reset status filter
                setSelectedContact(null); // Clear selected contact
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                activeTab === 'all' ? 'bg-[#F1F5F9] text-[#7C3AED] font-medium' : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              All Contacts ({contacts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('hot');
                setSearchTerm('');
                setFilterStatus('all');
                setSelectedContact(null);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                activeTab === 'hot' ? 'bg-[#F1F5F9] text-[#7C3AED] font-medium' : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Hot Leads ({contacts.filter(c => c.temperature === 'hot').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('warm');
                setSearchTerm('');
                setFilterStatus('all');
                setSelectedContact(null);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                activeTab === 'warm' ? 'bg-[#F1F5F9] text-[#7C3AED] font-medium' : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Warm Leads ({contacts.filter(c => c.temperature === 'warm').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('new');
                setSearchTerm('');
                setFilterStatus('all');
                setSelectedContact(null);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                activeTab === 'new' ? 'bg-[#F1F5F9] text-[#7C3AED] font-medium' : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              New ({contacts.filter(c => c.leadStatus === 'new').length})
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] w-5 h-5" />
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setSelectedContact({})}> {/* Assuming {} implies adding a new contact */}
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#64748B]">Loading contacts...</div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#64748B] mb-2">No contacts found</p>
                <Button onClick={() => setSelectedContact({})} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="p-4 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#7C3AED] cursor-pointer transition-colors"
                >
                  <h3 className="font-semibold text-[#1E293B] mb-1">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  <p className="text-sm text-[#64748B] mb-2">{contact.email}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      contact.temperature === 'hot' ? 'bg-red-100 text-red-700' :
                      contact.temperature === 'warm' ? 'bg-yellow-100 text-yellow-700' :
                      contact.temperature === 'cold' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700' // Default for undefined temperature
                    }`}>
                      {contact.temperature || 'cold'}
                    </span>
                    <span className="text-xs text-[#64748B] capitalize">
                      {contact.leadStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
