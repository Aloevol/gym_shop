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
    <div className='w-full min-h-[88vh] p-4'>
      {loading && <Loader />}
      
      <div className='w-full rounded-3xl bg-white p-7'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-semibold'>Hero Slider Management</h1>
          <Button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className='bg-blue-600 hover:bg-blue-700'
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Slide
          </Button>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className='mb-8 p-6 border-2 border-blue-200 rounded-2xl bg-blue-50'>
            <h2 className='text-2xl font-semibold mb-6'>
              {editingId ? 'Edit Slide' : 'Add New Slide'}
            </h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Left Column - Text Inputs */}
              <div className='space-y-4'>
                <div>
                  <Label className='text-lg font-semibold mb-2 block'>Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500'
                    placeholder="Enter slide title"
                  />
                </div>

                <div>
                  <Label className='text-lg font-semibold mb-2 block'>Description *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='min-h-[120px] p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500'
                    placeholder="Enter slide description"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className='text-lg font-semibold mb-2 block'>Button Text</Label>
                  <Input
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className='p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500'
                    placeholder="Button text (default: Shop Now)"
                  />
                </div>

                <div>
                  <Label className='text-lg font-semibold mb-2 block'>Button Link</Label>
                  <Input
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className='p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500'
                    placeholder="/shop"
                  />
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className='space-y-4'>
                <div>
                  <Label className='text-lg font-semibold mb-2 block'>
                    {editingId && !selectedFile ? 'Current Image' : 'Upload Image *'}
                  </Label>
                  
                  {/* Image Preview */}
                  <div className='h-[250px] w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden mb-4'>
                    {previewImage ? (
                      <ImageWithSkeleton
                        src={previewImage}
                        alt="Slide preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {editingId ? 'No image' : 'No image selected'}
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <div className='h-[60px] w-full bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl relative flex items-center justify-center'>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className='absolute w-full h-full opacity-0 cursor-pointer z-30'
                      onChange={handleFileChange}
                    />
                    <div className='text-center'>
                      <p className='text-blue-600 font-medium'>
                        {previewImage ? 'Change Image' : 'Click to select image'}
                      </p>
                      <p className='text-sm text-gray-500'>PNG, JPG, WEBP (Max 10MB)</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4'>
                  <Button
                    onClick={() => editingId ? handleUpdateSlide(editingId) : handleAddSlide()}
                    className='bg-green-600 hover:bg-green-700 flex-1'
                    disabled={loading || !title.trim() || !description.trim() || (!selectedFile && !editingId)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {editingId ? 'Update Slide' : 'Add Slide'}
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className='border-red-300 text-red-600 hover:bg-red-50'
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slides List */}
        <div className='mt-8'>
          <h2 className='text-2xl font-semibold mb-4'>Current Slides ({slides.length})</h2>
          
          {slides.length === 0 ? (
            <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl'>
              <p className='text-gray-500 text-lg'>No slides added yet. Click "Add New Slide" to get started.</p>
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
                            className={`p-4 border-2 rounded-xl flex items-center gap-4 ${
                              slide.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <GripVertical className="h-6 w-6 text-gray-400" />
                            </div>

                            {/* Order Number */}
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                              {slide.order + 1}
                            </div>

                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <ImageWithSkeleton
                                src={slide.imageUrl}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Slide Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold truncate">{slide.title}</h3>
                                {!slide.isActive && (
                                  <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm truncate">{slide.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>Button: {slide.buttonText || 'Shop Now'}</span>
                                <span>•</span>
                                <span>Link: {slide.buttonLink || '/shop'}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleStatus(slide._id)}
                                className={slide.isActive ? 'border-yellow-300 text-yellow-600' : 'border-green-300 text-green-600'}
                              >
                                {slide.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(slide)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSlide(slide._id)}
                              >
                                <Trash2 className="h-4 w-4" />
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

export default HeroSliderAdmin;