"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

// Server actions
import {
    uploadVideoServerSide,
    deleteVideoServerSide,
    getAllVideosServerSide
} from "@/server/functions/video.fun";
import {
    createTrainingProgramServerSide,
    updateTrainingProgramServerSide,
    deleteTrainingProgramServerSide,
    getAllTrainingProgramsServerSide,
    uploadTrainingImagesServerSide
} from "@/server/functions/training.fun";
import Image from "next/image";

interface Video {
    _id: string;
    url: string;
    title?: string;
    description?: string;
    duration?: number;
    format?: string;
    public_id?: string;
}

interface TrainingProgram {
    _id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    duration: string;
    imageUrl: string[];
    features: string[];
    category: string;
    isActive: boolean;
    isFeatured: boolean;
    rating: number;
    createdAt?: string;
    updatedAt?: string;
}

export default function PersonalTrainingManagement() {
    const [activeTab, setActiveTab] = useState<"videos" | "programs">("videos");

    // Video management state
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Training program state
    const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
    const [showProgramForm, setShowProgramForm] = useState(false);
    const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);

    // Load data function
    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            // Load videos using server action
            const videosResponse = await getAllVideosServerSide();
            if (!videosResponse.isError && videosResponse.data) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                setVideos(videosResponse.data.videos as Video[]);
            } else {
                toast.error(videosResponse.message || 'Failed to load videos');
            }

            // Load training programs using server action
            const programsResponse = await getAllTrainingProgramsServerSide();
            if (!programsResponse.isError && programsResponse.data) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                setTrainingPrograms(programsResponse.data.programs as TrainingProgram[]);
            } else {
                toast.error(programsResponse.message || 'Failed to load training programs');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Video management functions
    const handleVideoUpload = async () => {
        if (!selectedVideo) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('video', selectedVideo);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await uploadVideoServerSide(formData);
            clearInterval(progressInterval);

            if (!response.isError && response.data) {
                setUploadProgress(100);

                // Add to videos list
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const newVideo = response.data.video as Video;
                setVideos(prev => [newVideo, ...prev]);
                setSelectedVideo(null);

                setTimeout(() => setUploadProgress(0), 1000);
                toast.success('Video uploaded successfully');
            } else {
                throw new Error(response.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Video upload error:', error);
            toast.error('Video upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleVideoDelete = async (videoId: string, publicId?: string) => {
        if (!confirm("Are you sure you want to delete this video?")) return;

        try {
            const response = await deleteVideoServerSide(videoId, publicId);

            if (!response.isError) {
                setVideos(prev => prev.filter(video => video._id !== videoId));
                toast.success('Video deleted successfully');
            } else {
                throw new Error(response.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Video delete error:', error);
            toast.error('Video deletion failed');
        }
    };

    // Training program functions
    const handleAddProgram = () => {
        setEditingProgram(null);
        setSelectedImages([]);
        setShowProgramForm(true);
    };

    const handleEditProgram = (program: TrainingProgram) => {
        setEditingProgram(program);
        setSelectedImages([]);
        setShowProgramForm(true);
    };

    const handleDeleteProgram = async (programId: string) => {
        if (!confirm("Are you sure you want to delete this training program?")) return;

        try {
            const response = await deleteTrainingProgramServerSide(programId);

            if (!response.isError) {
                setTrainingPrograms(prev => prev.filter(program => program._id !== programId));
                toast.success('Training program deleted successfully');
            } else {
                throw new Error(response.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Program delete error:', error);
            toast.error('Program deletion failed');
        }
    };

    const handleProgramSubmit = async (programData: Partial<TrainingProgram>) => {
        try {
            // Upload images first
            let imageUrls: string[] = [];
            if (selectedImages.length > 0) {
                const imageFormData = new FormData();
                selectedImages.forEach(image => {
                    imageFormData.append('images', image);
                });

                const imageResponse = await uploadTrainingImagesServerSide(imageFormData);
                if (!imageResponse.isError && imageResponse.data) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                    imageUrls = imageResponse.data.urls as string[];
                } else {
                    throw new Error(imageResponse.message || 'Image upload failed');
                }
            }

            // Combine uploaded URLs with existing ones if editing
            const finalImageUrls = editingProgram
                ? [...programData.imageUrl || [], ...imageUrls]
                : imageUrls;

            const finalProgramData = {
                ...programData,
                imageUrl: finalImageUrls,
            };

            let response;
            if (editingProgram) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                response = await updateTrainingProgramServerSide(editingProgram._id, finalProgramData);
            } else {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                response = await createTrainingProgramServerSide(finalProgramData);
            }

            if (!response.isError && response.data) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                const savedProgram = response.data.program as TrainingProgram;

                if (editingProgram) {
                    setTrainingPrograms(prev =>
                        prev.map(p => p._id === savedProgram._id ? savedProgram : p)
                    );
                } else {
                    setTrainingPrograms(prev => [savedProgram, ...prev]);
                }

                setShowProgramForm(false);
                setEditingProgram(null);
                setSelectedImages([]);
                toast.success(`Training program ${editingProgram ? 'updated' : 'created'} successfully`);
            } else {
                throw new Error(response.message || 'Save failed');
            }
        } catch (error) {
            console.error('Program save error:', error);
            toast.error('Failed to save training program');
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedImages(prev => [...prev, ...files]);
    };

    const removeSelectedImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (programId: string, imageUrl: string) => {
        setTrainingPrograms(prev =>
            prev.map(program =>
                program._id === programId
                    ? {
                        ...program,
                        imageUrl: program.imageUrl.filter(url => url !== imageUrl)
                    }
                    : program
            )
        );
    };

    if (loading) {
        return (
            <div className="w-full h-[88vh] p-4">
                <div className="w-full h-full bg-white border rounded-3xl flex items-center justify-center">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[105vh] p-4">
            <div className="w-full h-full bg-white border rounded-3xl overflow-hidden">
                {/* Header with Tabs */}
                <div className="w-full flex flex-col p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-semibold">Personal Training Management</h1>
                        {activeTab === "programs" && !showProgramForm && (
                            <Button
                                onClick={handleAddProgram}
                                className="bg-[#125BAC] cursor-pointer hover:bg-[#0d4793]"
                            >
                                Add Program
                            </Button>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b">
                        <button
                            className={`px-4 py-2 font-medium ${
                                activeTab === "videos"
                                    ? "border-b-2 border-[#125BAC] text-[#125BAC]"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("videos")}
                        >
                            Video Management
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${
                                activeTab === "programs"
                                    ? "border-b-2 border-[#125BAC] text-[#125BAC]"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab("programs")}
                        >
                            Training Programs
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="w-full h-full p-4 overflow-auto">
                    {activeTab === "videos" && (
                        <VideoManagementTab
                            videos={videos}
                            selectedVideo={selectedVideo}
                            setSelectedVideo={setSelectedVideo}
                            uploadProgress={uploadProgress}
                            isUploading={isUploading}
                            onUpload={handleVideoUpload}
                            onDelete={handleVideoDelete}
                        />
                    )}

                    {activeTab === "programs" && (
                        <TrainingProgramsTab
                            programs={trainingPrograms}
                            showForm={showProgramForm}
                            editingProgram={editingProgram}
                            selectedImages={selectedImages}
                            onEdit={handleEditProgram}
                            onDelete={handleDeleteProgram}
                            onSubmit={handleProgramSubmit}
                            onCloseForm={() => {
                                setShowProgramForm(false);
                                setEditingProgram(null);
                                setSelectedImages([]);
                            }}
                            onImageSelect={handleImageSelect}
                            onRemoveSelectedImage={removeSelectedImage}
                            onRemoveExistingImage={removeExistingImage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Video Management Tab Component
interface VideoManagementTabProps {
    videos: Video[];
    selectedVideo: File | null;
    setSelectedVideo: (file: File | null) => void;
    uploadProgress: number;
    isUploading: boolean;
    onUpload: () => void;
    onDelete: (videoId: string, publicId?: string) => void;
}

function VideoManagementTab({
                                videos,
                                selectedVideo,
                                setSelectedVideo,
                                uploadProgress,
                                isUploading,
                                onUpload,
                                onDelete
                            }: VideoManagementTabProps) {
    return (
        <div className="space-y-6">
            {/* Video Upload Section */}
            <div className="border rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Upload New Video</h2>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)}
                                className="w-full"
                                disabled={isUploading}
                            />
                            {selectedVideo && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Selected: {selectedVideo.name} ({(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB)
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={onUpload}
                            disabled={!selectedVideo || isUploading}
                            className="bg-[#125BAC] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d4793]"
                        >
                            {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
                        </Button>
                    </div>

                    {uploadProgress > 0 && (
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-[#125BAC] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Videos Grid */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Uploaded Video</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                        <div
                            key={video._id}
                            className="border rounded-2xl p-4 relative hover:shadow-lg transition group"
                        >
                            <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                <video className="w-full h-full rounded-lg" controls src={video.url} autoPlay loop muted />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold truncate">{video.title || 'Untitled Video'}</h3>
                                {video.duration && (
                                    <p className="text-sm text-gray-600">
                                        Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 truncate">{video.url}</p>
                            </div>

                            <Button
                                onClick={() => onDelete(video._id, video.public_id)}
                                className="absolute top-2 right-2 bg-[#ac1212] text-white p-2 rounded-full hover:bg-[#7a0d0d] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Delete
                            </Button>
                        </div>
                    ))}

                    {videos.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            No videos uploaded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Training Programs Tab Component
interface TrainingProgramsTabProps {
    programs: TrainingProgram[];
    showForm: boolean;
    editingProgram: TrainingProgram | null;
    selectedImages: File[];
    onEdit: (program: TrainingProgram) => void;
    onDelete: (programId: string) => void;
    onSubmit: (programData: Partial<TrainingProgram>) => void;
    onCloseForm: () => void;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveSelectedImage: (index: number) => void;
    onRemoveExistingImage: (programId: string, imageUrl: string) => void;
}

function TrainingProgramsTab({
                                 programs,
                                 showForm,
                                 editingProgram,
                                 selectedImages,
                                 onEdit,
                                 onDelete,
                                 onSubmit,
                                 onCloseForm,
                                 onImageSelect,
                                 onRemoveSelectedImage,
                                 onRemoveExistingImage,
                             }: TrainingProgramsTabProps) {
    return (
        <div className="space-y-6">
            {showForm ? (
                <TrainingProgramForm
                    program={editingProgram}
                    selectedImages={selectedImages}
                    onSubmit={onSubmit}
                    onCancel={onCloseForm}
                    onImageSelect={onImageSelect}
                    onRemoveSelectedImage={onRemoveSelectedImage}
                    onRemoveExistingImage={onRemoveExistingImage}
                />
            ) : (
                <>
                    {/* Programs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {programs.map((program) => (
                            <div
                                key={program._id}
                                className="border rounded-2xl p-4 relative hover:shadow-lg transition group"
                            >
                                {program.imageUrl.length > 0 && (
                                    <Image
                                        src={program.imageUrl[0]}
                                        alt={program.title}
                                        className="w-full h-48 object-cover rounded-lg mb-3"
                                    />
                                )}

                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">{program.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>

                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-[#125BAC]">
                                            ${program.price}
                                            {program.originalPrice && program.originalPrice > program.price && (
                                                <span className="text-sm text-gray-500 line-through ml-2">
                                                    ${program.originalPrice}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-sm text-gray-600">{program.duration}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {program.features.slice(0, 3).map((feature, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                        {program.features.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                                                +{program.features.length - 3} more
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm text-gray-600">{program.category}</span>
                                        <div className="flex items-center space-x-2">
                                            {program.isFeatured && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                    Featured
                                                </span>
                                            )}
                                            {!program.isActive && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        onClick={() => onEdit(program)}
                                        className="bg-[#125BAC] text-white p-2 rounded-full hover:bg-[#0d4793]"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => onDelete(program._id)}
                                        className="bg-[#ac1212] text-white p-2 rounded-full hover:bg-[#7a0d0d]"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {programs.length === 0 && (
                            <div className="col-span-full text-center text-gray-500 py-8">
                                No training programs available.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Training Program Form Component
interface TrainingProgramFormProps {
    program?: TrainingProgram | null;
    selectedImages: File[];
    onSubmit: (programData: Partial<TrainingProgram>) => void;
    onCancel: () => void;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveSelectedImage: (index: number) => void;
    onRemoveExistingImage: (programId: string, imageUrl: string) => void;
}

function TrainingProgramForm({
                                 program,
                                 selectedImages,
                                 onSubmit,
                                 onCancel,
                                 onImageSelect,
                                 onRemoveSelectedImage,
                                 onRemoveExistingImage,
                             }: TrainingProgramFormProps) {
    const [formData, setFormData] = useState<Partial<TrainingProgram>>({
        title: program?.title || '',
        description: program?.description || '',
        price: program?.price || 0,
        originalPrice: program?.originalPrice || 0,
        duration: program?.duration || '',
        imageUrl: program?.imageUrl || [],
        features: program?.features || [],
        category: program?.category || '',
        isActive: program?.isActive ?? true,
        isFeatured: program?.isFeatured ?? false,
        rating: program?.rating || 0,
    });

    const [newFeature, setNewFeature] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...(prev.features || []), newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features?.filter((_, i) => i !== index) || []
        }));
    };

    const removeImage = (imageUrl: string) => {
        if (program?._id) {
            onRemoveExistingImage(program._id, imageUrl);
        }
        setFormData(prev => ({
            ...prev,
            imageUrl: prev.imageUrl?.filter(url => url !== imageUrl) || []
        }));
    };

    const handleInputChange = (field: keyof TrainingProgram, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="border rounded-2xl p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">
                {program ? 'Edit Training Program' : 'Add New Training Program'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category *</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => handleInputChange("category", e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 h-24 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Price (৳) *</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", Number(e.target.value))}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Original Price (৳)</label>
                        <input
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) => handleInputChange("originalPrice", Number(e.target.value))}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Duration *</label>
                        <input
                            type="text"
                            value={formData.duration}
                            onChange={(e) => handleInputChange("duration", e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                            placeholder="e.g., 12 weeks, 30 days"
                            required
                        />
                    </div>
                </div>

                {/* Image Upload Section */}
                <div>
                    <label className="block text-sm font-medium mb-1">Program Images *</label>

                    {/* Existing Images */}
                    {formData.imageUrl && formData.imageUrl.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Existing Images:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                {formData.imageUrl.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <Image
                                            src={url}
                                            alt={`Program image ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(url)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Image Upload */}
                    <div className="space-y-2">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onImageSelect}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                        />

                        {/* Selected Images Preview */}
                        {selectedImages.length > 0 && (
                            <div className="mt-2">
                                <h4 className="text-sm font-medium mb-2">New Images to Upload:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {selectedImages.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <Image
                                                src={URL.createObjectURL(file)}
                                                alt={`Selected ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onRemoveSelectedImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                            <p className="text-xs text-gray-600 truncate mt-1">
                                                {file.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Features</label>
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.features?.map((feature, index) => (
                                <span
                                    key={index}
                                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                                >
                                    {feature}
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                                placeholder="Add new feature"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addFeature();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={addFeature}
                                className="bg-[#125BAC] text-white px-3 py-2 rounded-lg hover:bg-[#0d4793]"
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleInputChange("isActive", e.target.checked)}
                            className="mr-2 text-[#125BAC] focus:ring-[#125BAC]"
                        />
                        <label className="text-sm font-medium">Active Program</label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.isFeatured}
                            onChange={(e) => handleInputChange("isFeatured", e.target.checked)}
                            className="mr-2 text-[#125BAC] focus:ring-[#125BAC]"
                        />
                        <label className="text-sm font-medium">Featured Program</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <input
                            type="number"
                            value={formData.rating}
                            onChange={(e) => handleInputChange("rating", Number(e.target.value))}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#125BAC] focus:border-transparent"
                            min="0"
                            max="5"
                            step="0.1"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button
                        type="submit"
                        className="bg-[#125BAC] text-white px-6 py-2 rounded-lg hover:bg-[#0d4793] disabled:opacity-50"
                        disabled={isSubmitting || ((!formData.imageUrl || formData.imageUrl.length === 0) && selectedImages.length === 0)}
                    >
                        {isSubmitting ? 'Saving...' : program ? 'Update Program' : 'Create Program'}
                    </Button>
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}