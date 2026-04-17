"use client";

import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    getAllContactMessagesServerSide,
    markContactMessageAsReadServerSide,
    deleteContactMessageServerSide
} from '@/server/functions/contact.fun';
import { IContactMessage } from '@/server/models/contact/contact.interface';
import { toast } from 'sonner';
import { Mail, MessageSquareText, Trash2, CheckCheck } from 'lucide-react';

function Contact() {
    const [contacts, setContacts] = useState<IContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const result = await getAllContactMessagesServerSide();
            if (!result.isError && result.data) {
                const { messages } = result.data as { messages: IContactMessage[] };
                setContacts(messages);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch contacts");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const result = await markContactMessageAsReadServerSide(id);
            if (!result.isError) {
                toast.success("Message marked as read");
                fetchContacts(); // Refresh the list
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update message");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;

        try {
            const result = await deleteContactMessageServerSide(id);
            if (!result.isError) {
                toast.success("Message deleted successfully");
                fetchContacts(); // Refresh the list
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete message");
        }
    };

    const getStatusBadge = (status: string, isRead: boolean) => {
        return (
            <Badge
                className={`border text-[10px] font-black uppercase tracking-[0.18em] ${
                    status === "resolved"
                        ? "border-green-500/20 bg-green-500/10 text-green-400"
                        : status === "replied"
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
            >
                {status} {!isRead && "•"}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-[88vh] rounded-[3rem] border border-white/10 bg-white/5 p-10 animate-pulse" />
        );
    }

    return (
        <div className='w-full h-[88vh] overflow-auto'>
            <div className="w-full rounded-[3rem] border border-white/10 bg-white/5 p-6 md:p-8 shadow-2xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
                            Contact <span className="text-primary">&</span> Support Messages
                        </h1>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                            Review inbound customer questions in a dark operations queue
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black px-5 py-3">
                        <MessageSquareText size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                            {contacts.length} Total Messages
                        </span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
                    <Table>
                        <TableCaption className="py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                            List of all people who contacted you.
                        </TableCaption>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Name</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Email</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Subject</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Message</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.length > 0 ? (
                                contacts.map((item) => (
                                    <TableRow
                                        key={item?._id?.toString()}
                                        className={`border-white/5 ${
                                            !item.isRead ? "bg-primary/5" : "bg-transparent"
                                        }`}
                                    >
                                        <TableCell className="font-medium text-white">{item.name}</TableCell>
                                        <TableCell className="text-white/65">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail size={14} className="text-primary" />
                                                {item.email}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-white/75">{item.subject}</TableCell>
                                        <TableCell className="max-w-[250px] truncate text-white/55" title={item.message}>
                                            {item.message}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(item.status, item.isRead)}
                                        </TableCell>
                                        <TableCell className="text-white/45">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {!item.isRead && (
                                                    <Button
                                                        size="sm"
                                                        className="rounded-full bg-primary text-black hover:bg-white"
                                                        onClick={() => handleMarkAsRead(item?._id?.toString() as string)}
                                                    >
                                                        <CheckCheck size={14} className="mr-2" />
                                                        Mark Read
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    className="rounded-full border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                                                    onClick={() => handleDelete(item?._id?.toString() as string)}
                                                >
                                                    <Trash2 size={14} className="mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                                        No messages yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

export default Contact;
