"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@radix-ui/react-label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { 
  getAllBannerMessagesServerSide, 
  createBannerMessageServerSide, 
  updateBannerMessageServerSide, 
  deleteBannerMessageServerSide,
  reorderBannerMessagesServerSide 
} from '@/server/functions/banner.fun';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DroppableProvided } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Edit, Save, X } from 'lucide-react';

interface BannerMessage {
  _id: string;
  text: string;
  icon: string;
  isActive: boolean;
  order: number;
}

interface IBannerResponseData {
  messages: BannerMessage[];
}

function BannerManagement() {
  const [messages, setMessages] = useState<BannerMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState({ text: '', icon: '🔹' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await getAllBannerMessagesServerSide();
      if (!response.isError && response.data) {
        const {messages} = response.data as IBannerResponseData;
        setMessages(messages || []);
      }
    } catch {
      toast.error('Failed to fetch banner messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = async () => {
    if (!newMessage.text.trim()) {
      toast.error('Message text is required');
      return;
    }

    setLoading(true);
    try {
      const response = await createBannerMessageServerSide(newMessage.text, newMessage.icon);
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        setNewMessage({ text: '', icon: '🔹' });
        fetchMessages();
      }
    } catch {
      toast.error('Failed to create message');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (messageId: string, isActive: boolean) => {
    try {
      const response = await updateBannerMessageServerSide(messageId, { isActive });
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success('Message status updated');
        fetchMessages();
      }
    } catch {
      toast.error('Failed to update message status');
    }
  };

  const handleEdit = (message: BannerMessage) => {
    setEditingId(message._id);
    setEditText(message.text);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim()) {
      toast.error('Message text is required');
      return;
    }

    try {
      const response = await updateBannerMessageServerSide(messageId, { text: editText });
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success('Message updated successfully');
        setEditingId(null);
        setEditText('');
        fetchMessages();
      }
    } catch {
      toast.error('Failed to update message');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await deleteBannerMessageServerSide(messageId);
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success('Message deleted successfully');
        fetchMessages();
      }
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(messages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setMessages(items);

    // Update order in database
    try {
      const orderedIds = items.map(item => item._id);
      await reorderBannerMessagesServerSide(orderedIds);
      toast.success('Order updated successfully');
    } catch {
      toast.error('Failed to update order');
      fetchMessages(); // Revert on error
    }
  };

  const commonIcons = ['🔹', '🚚', '💸', '📦', '🔥', '🌍', '🥇', '⭐', '🎯', '💎'];

  return (
    <div className="w-full min-h-full">
      <div className="w-full bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-custom font-bold text-white uppercase tracking-widest">PERFORMANCE <span className="text-primary">TICKER</span></h1>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage scrolling broadcast messages</p>
        </div>

        {/* Add New Message */}
        <div className="mb-12 p-10 border border-primary/20 rounded-[2.5rem] bg-primary/5 animate-in slide-in-from-top duration-500">
          <h2 className="text-xl font-custom font-bold text-white uppercase tracking-widest mb-8 text-center sm:text-left">INITIALIZE NEW BROADCAST</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">BROADCAST CONTENT *</Label>
              <Input
                placeholder="ENTER PERFORMANCE MESSAGE"
                value={newMessage.text}
                onChange={(e) => setNewMessage({ ...newMessage, text: e.target.value })}
                className="bg-black border-white/10 rounded-full px-6 py-6 text-white focus:border-primary transition-all placeholder:text-white/5"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">VISUAL INDICATOR</Label>
              <select
                value={newMessage.icon}
                onChange={(e) => setNewMessage({ ...newMessage, icon: e.target.value })}
                className="bg-black border-white/10 rounded-full px-6 py-[14px] text-white focus:border-primary transition-all outline-none appearance-none cursor-pointer"
              >
                {commonIcons.map(icon => (
                  <option key={icon} value={icon} className="bg-black text-xl">{icon}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleCreateMessage}
                className="bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-xs w-full shadow-xl shadow-primary/10 disabled:opacity-20"
                disabled={loading || !newMessage.text.trim()}
              >
                DEPLOY BROADCAST
              </button>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div>
          <h2 className="text-sm font-custom font-bold text-white uppercase tracking-widest mb-8">ACTIVE TICKER SEQUENCE ({messages.length})</h2>
          
          {messages.length === 0 ? (
            <div className="text-center py-20 bg-black rounded-[3rem] border border-dashed border-white/10">
              <p className="text-white/20 font-black uppercase tracking-widest text-sm">NO BROADCASTS DEPLOYED</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="banner-messages">
                {(provided: DroppableProvided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {messages.map((message, index) => (
                      <Draggable key={message._id} draggableId={message._id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-6 p-6 bg-black border rounded-3xl group transition-all duration-500 ${
                              message.isActive ? 'border-white/10' : 'border-red-500/20 opacity-50'
                            }`}
                          >
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-white/5 rounded-lg transition-colors">
                              <GripVertical className="h-6 w-6 text-white/20 group-hover:text-primary" />
                            </div>

                            {/* Icon */}
                            <div className="w-14 h-14 bg-white/5 text-3xl flex items-center justify-center rounded-2xl border border-white/10">
                              {message.icon}
                            </div>

                            {/* Message Text */}
                            <div className="flex-1 min-w-0">
                              {editingId === message._id ? (
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="bg-black border-primary rounded-full px-6 py-4 text-white outline-none"
                                  autoFocus
                                />
                              ) : (
                                <p className={`text-lg font-black uppercase tracking-tight truncate ${!message.isActive ? 'text-white/20 line-through' : 'text-white'}`}>
                                  {message.text}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              {/* Status Toggle */}
                              <div className="flex items-center gap-3 mr-4">
                                <Switch
                                  checked={message.isActive}
                                  onCheckedChange={(checked) => handleUpdateStatus(message._id, checked)}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest hidden sm:block w-16">
                                  {message.isActive ? 'LIVE' : 'OFFLINE'}
                                </span>
                              </div>

                              {/* Edit/Save */}
                              {editingId === message._id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(message._id)}
                                    className="p-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black transition-all"
                                  >
                                    <Save size={18} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all"
                                  >
                                    <X size={18} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleEdit(message)}
                                  className="p-3 rounded-full border border-white/10 text-white/40 hover:border-white hover:text-white transition-all"
                                >
                                  <Edit size={18} />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(message._id)}
                                className="p-3 rounded-full border border-red-500/20 text-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
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

export default BannerManagement;