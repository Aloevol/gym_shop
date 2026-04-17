"use client";

import { useState, useEffect } from "react";
import { Pen, LogOut, Save, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUserProfileServerSide, changeUserPasswordServerSide } from "@/server/functions/user.fun";
import { IUser } from "@/server/models/user/user.interfce";
import { getCookie, setCookie } from "@/server/helper/jwt.helper";
import { isAuthenticatedAndGetUser } from "@/server/functions/auth.fun";
import { USER_ROLE, USER_STATUS } from "@/enum/user.enum";
import { uploadMultipleToCloudinary } from "@/server/helper/cloudinary.helper";
import Image from "next/image";

export default function ProfileTabs() {
    const [tab, setTab] = useState<"profile" | "password">("profile");
    const [user, setUser] = useState<IUser>({
        name: "",
        image: "https://res.cloudinary.com/ddsnont4o/image/upload/v1760025348/jhkjjhk_iesrwh.png",
        email: "",
        password: "",
        status: USER_STATUS.ACTIVE,
        isVerified: true,
        role: USER_ROLE.USER,
        createdAt: new Date()
    });
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string>("");

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        email: ""
    });

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Load user data on component mount
    useEffect(() => {
        const loadUserData = async () => {
            const cookie = await getCookie("user");
            if (typeof cookie == 'string' ) {
                const userData = JSON.parse(cookie);
                setUser(userData);
                setPreviewImage(userData.image);
                setFormData({
                    name: userData.name || "",
                    contact: userData.contact || "",
                    email: userData.email || ""
                });
            } else {
                const res = await isAuthenticatedAndGetUser();
                if ( typeof res != "string" && res.isError == true) {
                    setUser({
                        name: "Guest User",
                        image: "https://res.cloudinary.com/ddsnont4o/image/upload/v1760025348/jhkjjhk_iesrwh.png",
                        email: "guest@example.com",
                        password: "",
                        status: USER_STATUS.ACTIVE,
                        isVerified: true,
                        role: USER_ROLE.USER,
                        createdAt: new Date()
                    });
                } else if ( typeof res == "string" ) {
                    await setCookie({name:"user", value: res });
                    const userData = JSON.parse(res);
                    setUser(userData);
                    setPreviewImage(userData.image);
                    setFormData({
                        name: userData.name || "",
                        contact: userData.contact || "",
                        email: userData.email || ""
                    });
                }
            }
        };

        loadUserData();
    }, []);

    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);

        // Auto-upload when image is selected
        await handleImageUpload(file);
    };

    const handleImageUpload = async (file: File) => {
        setImageUploading(true);
        try {
            if (!user._id) {
                toast.error("User not found");
                return;
            }

            const uploadedUrls = await uploadMultipleToCloudinary([file]);
            const newImageUrl = uploadedUrls[0];

            if (newImageUrl) {
                const response = await updateUserProfileServerSide(user._id, {
                    image: newImageUrl
                });

                if (!response.isError && response.data) {
                    const updatedUser = { ...user, image: newImageUrl };
                    setUser(updatedUser);
                    await setCookie({name:"user", value: JSON.stringify(updatedUser) });
                    toast.success("Profile image updated successfully");
                } else {
                    toast.error("Failed to update profile image");
                }
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setImageUploading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user._id) {
                toast.error("User not found");
                return;
            }

            const response = await updateUserProfileServerSide(user._id, {
                name: formData.name,
                contact: formData.contact
            });

            if (!response.isError && response.data) {
                const updatedUser = { 
                    ...user, 
                    name: formData.name, 
                    contact: formData.contact 
                };
                setUser(updatedUser);
                await setCookie({name:"user", value: JSON.stringify(updatedUser) });
                toast.success("Profile updated successfully");
            } else {
                toast.error(response.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user._id) {
                toast.error("User not found");
                return;
            }

            // Validation
            if (!currentPassword) {
                toast.error("Please enter your current password");
                return;
            }

            if (!newPassword) {
                toast.error("Please enter a new password");
                return;
            }

            if (newPassword.length < 6) {
                toast.error("Password must be at least 6 characters long");
                return;
            }

            if (newPassword !== confirmPassword) {
                toast.error("New passwords do not match");
                return;
            }

            const response = await changeUserPasswordServerSide(user._id, {
                currentPassword,
                newPassword
            });

            if (!response.isError) {
                toast.success("Password changed successfully");
                // Clear form
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            } else {
                toast.error(response.message || "Failed to change password");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        try {
            // Clear all cookies
            const cookies = document.cookie.split(";");
            for (const cookie of cookies) {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }

            // Clear localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();

            toast.success("Logged out successfully");
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = "/";
            }, 1000);

        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Logout failed");
            window.location.href = "/";
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            name: user.name || "",
            contact: user.contact || "",
            email: user.email || ""
        });
        setSelectedFile(null);
        setPreviewImage(user.image);
    };

    const handleCancelPassword = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    if (!user._id) {
        return (
            <div className="w-full h-[85vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4 uppercase tracking-widest">Unable to load user data</p>
                    <Button 
                        onClick={() => window.location.reload()}
                        className="rounded-full bg-primary text-black hover:bg-white"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[85vh] overflow-auto">
            {/* Header with Logout */}
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                {/* Tabs */}
                <div>
                    <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
                        User <span className="text-primary">Account</span>
                    </h1>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                        Manage account details and password from a dark control panel
                    </p>
                    <div className="mt-6 inline-flex rounded-full border border-white/10 bg-black p-1">
                    <button
                        onClick={() => setTab("profile")}
                        className={`rounded-full px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            tab === "profile"
                                ? "bg-primary text-black shadow-lg shadow-primary/20"
                                : "text-white/55 hover:text-white"
                        }`}
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={() => setTab("password")}
                        className={`rounded-full px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                            tab === "password"
                                ? "bg-primary text-black shadow-lg shadow-primary/20"
                                : "text-white/55 hover:text-white"
                        }`}
                    >
                        Change Password
                    </button>
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white whitespace-nowrap"
                >
                    <LogOut size={18} />
                    Logout
                </Button>
            </div>

            {/* Content Card */}
            <div className="max-w-[760px] rounded-[3rem] border border-white/10 bg-white/5 p-8 shadow-2xl">
                {tab === "profile" && (
                    <form onSubmit={handleSaveProfile}>
                        {/* Profile Image */}
                        <div className="w-[200px] h-[200px] mx-auto rounded-full bg-black relative overflow-hidden border-4 border-primary/30 shadow-xl shadow-primary/10">
                            <Image 
                                src={previewImage || user.image} 
                                alt="profile" 
                                fill 
                                className="object-cover" 
                            />
                            
                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="profile-image-input"
                            />
                            
                            <div className="absolute w-[44px] h-[44px] bottom-6 right-6 bg-primary text-black z-50 cursor-pointer rounded-full shadow-lg shadow-primary/20">
                                <label 
                                    htmlFor="profile-image-input"
                                    className="w-full h-full relative flex items-center justify-center cursor-pointer"
                                >
                                    {imageUploading ? (
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Pen className="text-black" />
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="mt-6 flex flex-col gap-4 max-w-[400px] mx-auto">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                    className="w-full rounded-full border-white/10 bg-black text-white"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Email</Label>
                                <Input
                                    id="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full rounded-full border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                                />
                                <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">Email cannot be changed</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="contact" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Contact Number</Label>
                                <Input
                                    id="contact"
                                    value={formData.contact}
                                    onChange={(e) => handleInputChange("contact", e.target.value)}
                                    placeholder="+1234567890"
                                    className="w-full rounded-full border-white/10 bg-black text-white"
                                />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <Button 
                                    type="submit"
                                    disabled={loading || imageUploading}
                                    className="rounded-full bg-primary text-black hover:bg-white flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    {loading ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-full border-white/10 bg-black text-white hover:bg-white hover:text-black"
                                >
                                    <X size={16} />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </form>
                )}

                {tab === "password" && (
                    <form onSubmit={handlePasswordChange}>
                        <div className="flex flex-col gap-4 max-w-[400px] mx-auto">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="currentPassword" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="w-full pr-10 rounded-full border-white/10 bg-black text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/35"
                                    >
                                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pr-10 rounded-full border-white/10 bg-black text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/35"
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full pr-10 rounded-full border-white/10 bg-black text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/35"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <Button 
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-full bg-primary text-black hover:bg-white flex items-center gap-2"
                                >
                                    {loading ? "Changing..." : "Change Password"}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelPassword}
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-full border-white/10 bg-black text-white hover:bg-white hover:text-black"
                                >
                                    <X size={16} />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
