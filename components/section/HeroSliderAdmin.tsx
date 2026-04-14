"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Input } from '../ui/input';
import { Label } from '@radix-ui/react-label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import ImageWithSkeleton from '../ui/ImageWIthSkeleton';
import Loader from '../loader/Loader';
import { toast } from 'sonner';
import { 
  getAllHeroSlidesAdminServerSide, 
  addHeroSlideServerSide, 
  updateHeroSlideServerSide,
  deleteHeroSlideServerSide,
  reorderHeroSlidesServerSide,
  toggleHeroSlideStatusServerSide
} from '@/server/functions/admin.fun';
import { 
  IHeroSlideInput,
  IReorderSlidesInput,
  IUpdateHeroSlideInput
} from '@/server/interface/admin.interface';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X } from 'lucide-react';

interface HeroSlide {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  buttonText?: string;
  buttonLink?: string;
}

function HeroSliderAdmin() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Shop Now');
  const [buttonLink, setButtonLink] = useState<string>('/shop');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  const fetchHeroSlides = async () => {
    try {
      setLoading(true);
      const res = await getAllHeroSlidesAdminServerSide();
      if (res.data) {
        setSlides(res.data as HeroSlide[]);
      }
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      toast.error("Failed to load hero slides");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setButtonText('Shop Now');
    setButtonLink('/shop');
    setPreviewImage(null);
    setSelectedFile(null);
    setEditingId(null);
    setIsAdding(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      toast.info("Image selected");
    }
  };

  const handleAddSlide = async () => {
    if (!title.trim() || !description.trim() || !selectedFile) {
      toast.error("Title, description, and image are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("buttonText", buttonText);
      formData.append("buttonLink", buttonLink);
      formData.append("imageFile", selectedFile);

      const response = await addHeroSlideServerSide(formData as IHeroSlideInput);
      
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success("Slide added successfully!");
        resetForm();
        await fetchHeroSlides();
      }
    } catch (error) {
      console.error("Error adding slide:", error);
      toast.error("Failed to add slide");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlide = async (slideId: string) => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("slideId", slideId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("buttonText", buttonText);
      formData.append("buttonLink", buttonLink);
      
      if (selectedFile) {
        formData.append("imageFile", selectedFile);
      }

      const response = await updateHeroSlideServerSide(formData as IUpdateHeroSlideInput);

      console.log(response)
      
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success("Slide updated successfully!");
        resetForm();
        await fetchHeroSlides();
      }
    } catch (error) {
      console.error("Error updating slide:", error);
      toast.error("Failed to update slide");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    setLoading(true);
    try {
      const response = await deleteHeroSlideServerSide(slideId);
      
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success("Slide deleted successfully!");
        await fetchHeroSlides();
      }
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("Failed to delete slide");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (slideId: string) => {
    try {
      const response = await toggleHeroSlideStatusServerSide(slideId);
      
      if (response.isError) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        await fetchHeroSlides();
      }
    } catch (error) {
      console.error("Error toggling slide status:", error);
      toast.error("Failed to update slide status");
    }
  };

  const handleEditClick = (slide: HeroSlide) => {
    setEditingId(slide._id);
    setTitle(slide.title);
    setDescription(slide.description);
    setButtonText(slide.buttonText || 'Shop Now');
    setButtonLink(slide.buttonLink || '/shop');
    setPreviewImage(slide.imageUrl);
    setSelectedFile(null);
    setIsAdding(false);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local order
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setSlides(updatedItems);

    // Save to server
    try {
      const slidesData = updatedItems.map((slide, index) => ({
        slideId: slide._id,
        order: index
      }));

      const formData = new FormData();
      formData.append("slides", JSON.stringify(slidesData));

      await reorderHeroSlidesServerSide(formData as IReorderSlidesInput);
      toast.success("Slides reordered successfully!");
    } catch (error) {
      console.error("Error reordering slides:", error);
      toast.error("Failed to save order");
      await fetchHeroSlides(); // Revert on error
    }
  };

  return (
    <div className='w-full min-h-full'>
      {loading && <Loader />}
      
      <div className='w-full rounded-[3rem] bg-white/5 border border-white/10 p-10 shadow-2xl'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12'>
          <div>
            <h1 className='text-3xl md:text-4xl font-custom font-bold text-white uppercase tracking-widest'>HERO <span className="text-primary">SLIDER</span></h1>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage frontline performance visuals</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className='bg-primary text-black font-custom font-bold px-8 py-4 rounded-full hover:bg-white transition-all uppercase text-xs shadow-xl shadow-primary/10 flex items-center gap-2'
          >
            <Plus size={18} strokeWidth={3} /> ADD NEW SLIDE
          </button>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className='mb-12 p-10 border border-primary/20 rounded-[2.5rem] bg-primary/5 animate-in slide-in-from-top duration-500'>
            <h2 className='text-xl font-custom font-bold text-white uppercase tracking-widest mb-10'>
              {editingId ? 'EDIT PERFORMANCE SLIDE' : 'INITIALIZE NEW SLIDE'}
            </h2>
            
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
              {/* Left Column - Text Inputs */}
              <div className='space-y-6'>
                <div className="space-y-2">
                  <Label className='text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block'>Slide Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='bg-black border-white/10 rounded-full px-6 py-6 text-white focus:border-primary transition-all placeholder:text-white/5'
                    placeholder="ENTER BOLD TITLE"
                  />
                </div>

                <div className="space-y-2">
                  <Label className='text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block'>Performance Description *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='bg-black border-white/10 rounded-[2rem] px-6 py-4 text-white focus:border-primary transition-all min-h-[120px] placeholder:text-white/5'
                    placeholder="DESCRIBE THE ACTION"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className='text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block'>Button Text</Label>
                    <Input
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className='bg-black border-white/10 rounded-full px-6 py-6 text-white focus:border-primary transition-all'
                      placeholder="SHOP NOW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className='text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block'>Button Link</Label>
                    <Input
                      value={buttonLink}
                      onChange={(e) => setButtonLink(e.target.value)}
                      className='bg-black border-white/10 rounded-full px-6 py-6 text-white focus:border-primary transition-all'
                      placeholder="/shop"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className='space-y-6'>
                <div className="space-y-2">
                  <Label className='text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block'>
                    {editingId && !selectedFile ? 'ACTIVE VISUAL' : 'UPLOAD VISUAL *'}
                  </Label>
                  
                  <div className='h-[250px] w-full bg-black border border-white/10 rounded-[2rem] overflow-hidden mb-4 relative group'>
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        alt="Slide preview"
                        fill
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black tracking-widest text-xs">
                        NO VISUAL SELECTED
                      </div>
                    )}
                  </div>

                  <div className='h-[64px] w-full bg-white/5 border border-dashed border-white/10 rounded-full relative flex items-center justify-center hover:bg-white/10 transition-all'>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className='absolute w-full h-full opacity-0 cursor-pointer z-30'
                      onChange={handleFileChange}
                    />
                    <p className='text-xs font-black text-primary uppercase tracking-widest'>
                      {previewImage ? 'REPLACE VISUAL' : 'SELECT PERFORMANCE IMAGE'}
                    </p>
                  </div>
                </div>

                <div className='flex gap-4 pt-4'>
                  <button
                    onClick={() => editingId ? handleUpdateSlide(editingId) : handleAddSlide()}
                    className='flex-1 bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-xs disabled:opacity-20'
                    disabled={loading || !title.trim() || !description.trim() || (!selectedFile && !editingId)}
                  >
                    {editingId ? 'COMMIT CHANGES' : 'INITIALIZE SLIDE'}
                  </button>
                  <button
                    onClick={resetForm}
                    className='px-10 py-4 border border-white/10 text-white font-custom font-bold uppercase tracking-widest rounded-full hover:bg-white/5 transition-all text-xs'
                  >
                    ABORT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slides List */}
        <div>
          <h2 className='text-sm font-custom font-bold text-white uppercase tracking-widest mb-8'>ACTIVE PERFORMANCE SEQUENCE ({slides.length})</h2>
          
          {slides.length === 0 ? (
            <div className='text-center py-20 bg-black rounded-[3rem] border border-dashed border-white/10'>
              <p className='text-white/20 font-black uppercase tracking-widest text-sm'>NO SLIDES INITIALIZED</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="slides">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {slides.map((slide, index) => (
                      <Draggable key={slide._id} draggableId={slide._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-6 bg-black border rounded-3xl flex items-center gap-6 group transition-all duration-500 ${
                              slide.isActive ? 'border-white/10' : 'border-red-500/20 opacity-50'
                            }`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-move p-2 hover:bg-white/5 rounded-lg transition-colors">
                              <GripVertical className="h-6 w-6 text-white/20 group-hover:text-primary" />
                            </div>

                            <div className="w-10 h-10 bg-white/5 text-primary rounded-full flex items-center justify-center font-black text-xs border border-white/10 shrink-0">
                              {index + 1}
                            </div>

                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 relative">
                              <Image
                                src={slide.imageUrl}
                                alt={slide.title}
                                fill
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">{slide.title}</h3>
                                {!slide.isActive && (
                                  <span className="px-3 py-1 text-[8px] font-black bg-red-500 text-white rounded-full uppercase tracking-widest">
                                    INACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest truncate">{slide.description}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleStatus(slide._id)}
                                className={`p-3 rounded-full border transition-all ${
                                  slide.isActive ? 'border-primary/20 text-primary hover:bg-primary hover:text-black' : 'border-white/10 text-white/20 hover:border-primary hover:text-primary'
                                }`}
                              >
                                {slide.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <button
                                onClick={() => handleEditClick(slide)}
                                className="p-3 rounded-full border border-white/10 text-white/40 hover:border-white hover:text-white transition-all"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteSlide(slide._id)}
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

export default HeroSliderAdmin;