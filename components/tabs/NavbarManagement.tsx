"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@radix-ui/react-label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { 
  getNavLinksServerSide, 
  addNavLinkServerSide, 
  updateNavLinkServerSide, 
  deleteNavLinkServerSide,
  reorderNavLinksServerSide 
} from '@/server/functions/admin.fun';
import { IUpdateNavLinkInput } from '@/server/interface/admin.interface';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DroppableProvided } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Edit, Save, X, ExternalLink } from 'lucide-react';

interface NavLink {
  _id: string;
  name: string;
  href: string;
  isActive: boolean;
  order: number;
}

function NavbarManagement() {
  const [links, setLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', href: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', href: '' });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await getNavLinksServerSide();
      if (!response.isError && response.data) {
        setLinks(response.data as NavLink[]);
      }
    } catch {
      toast.error('Failed to fetch nav links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!newLink.name.trim() || !newLink.href.trim()) {
      toast.error('Name and Href are required');
      return;
    }

    setLoading(true);
    try {
      const response = await addNavLinkServerSide(newLink);
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        setNewLink({ name: '', href: '' });
        fetchLinks();
      }
    } catch {
      toast.error('Failed to create nav link');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (linkId: string, isActive: boolean) => {
    try {
      const response = await updateNavLinkServerSide({ linkId, isActive } as IUpdateNavLinkInput);
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success('Link status updated');
        fetchLinks();
      }
    } catch {
      toast.error('Failed to update link status');
    }
  };

  const handleEdit = (link: NavLink) => {
    setEditingId(link._id);
    setEditData({ name: link.name, href: link.href });
  };

  const handleSaveEdit = async (linkId: string) => {
    if (!editData.name.trim() || !editData.href.trim()) {
      toast.error('Name and Href are required');
      return;
    }

    try {
      const response = await updateNavLinkServerSide({ 
        linkId, 
        name: editData.name, 
        href: editData.href 
      });
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success('Link updated successfully');
        setEditingId(null);
        fetchLinks();
      }
    } catch {
      toast.error('Failed to update link');
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this nav link?')) return;

    try {
      const response = await deleteNavLinkServerSide(linkId);
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success('Link deleted successfully');
        fetchLinks();
      }
    } catch {
      toast.error('Failed to delete link');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLinks(items);

    try {
      const reorderData = {
        links: items.map((item, index) => ({
          linkId: item._id,
          order: index
        }))
      };
      await reorderNavLinksServerSide(reorderData);
      toast.success('Order updated successfully');
    } catch {
      toast.error('Failed to update order');
      fetchLinks();
    }
  };

  return (
    <div className="w-full min-h-[88vh] p-4">
      <div className="w-full h-full bg-white border rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Navbar Management</h1>
        </div>

        {/* Add New Link */}
        <div className="mb-8 p-6 border rounded-2xl bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Add New Nav Link</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <Label className="text-sm font-medium mb-2">Display Name *</Label>
              <Input
                placeholder="e.g. Products"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                className="p-3 border-2 border-gray-200 rounded-lg"
              />
            </div>
            
            <div className="flex flex-col">
              <Label className="text-sm font-medium mb-2">URL / Path *</Label>
              <Input
                placeholder="e.g. /shop"
                value={newLink.href}
                onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                className="p-3 border-2 border-gray-200 rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCreateLink}
                className="bg-[#125BAC] hover:bg-[#0f4a8c] cursor-pointer w-full"
                disabled={loading || !newLink.name.trim() || !newLink.href.trim()}
              >
                Add Link
              </Button>
            </div>
          </div>
        </div>

        {/* Links List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Manage Nav Links ({links.length})</h2>
          
          {links.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No nav links found. Add your first link above.
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="nav-links">
                {(provided: DroppableProvided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {links.map((link, index) => (
                      <Draggable key={link._id} draggableId={link._id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                          >
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>

                            {/* Link Info */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {editingId === link._id ? (
                                <>
                                  <Input
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="p-2 border rounded"
                                    placeholder="Name"
                                  />
                                  <Input
                                    value={editData.href}
                                    onChange={(e) => setEditData({ ...editData, href: e.target.value })}
                                    className="p-2 border rounded"
                                    placeholder="URL"
                                  />
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-[#125BAC]">{link.name}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <ExternalLink size={14} />
                                    {link.href}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {/* Status Toggle */}
                              <div className="flex items-center gap-2 mr-4">
                                <Switch
                                  checked={link.isActive}
                                  onCheckedChange={(checked) => handleUpdateStatus(link._id, checked)}
                                />
                                <Label className="text-sm font-medium">
                                  {link.isActive ? 'Visible' : 'Hidden'}
                                </Label>
                              </div>

                              {/* Edit/Save */}
                              {editingId === link._id ? (
                                <>
                                  <Button
                                    onClick={() => handleSaveEdit(link._id)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => setEditingId(null)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => handleEdit(link)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}

                              {/* Delete */}
                              <Button
                                onClick={() => handleDelete(link._id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}

export default NavbarManagement;