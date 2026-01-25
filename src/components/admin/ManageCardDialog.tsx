import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sqlApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, CreditCard, Trash2 } from 'lucide-react';

interface ManageCardDialogProps {
    user: {
        id: number;
        full_name: string;
        email: string;
        emp_no?: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ManageCardDialog = ({ user, open, onOpenChange }: ManageCardDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        card_no: '',
        participant_name: '',
        emp_no: '',
        cnic: '',
        customer_no: '',
        dob: '',
        valid_upto: '',
        branch: '',
        benefit_covered: '',
        hospitalization: '',
        room_limit: '',
        normal_delivery: '',
        c_section_limit: '',
        total_limit: '100000',
    });

    useEffect(() => {
        if (open && user) {
            fetchUserCard();
        } else {
            // Reset form when closing or switching user
            setFormData({
                card_no: '',
                participant_name: user?.full_name || '',
                emp_no: user?.emp_no || '',
                cnic: '',
                customer_no: '',
                dob: '',
                valid_upto: '',
                branch: '',
                benefit_covered: '',
                hospitalization: '',
                room_limit: '',
                normal_delivery: '',
                c_section_limit: '',
                total_limit: '100000',
            });
        }
    }, [open, user]);

    const fetchUserCard = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await sqlApi.medicalCards.getByUserId(user.id);
            if (data) {
                // Format dates for input type="date"
                const formattedData = {
                    ...data,
                    dob: data.dob ? data.dob.split('T')[0] : '',
                    valid_upto: data.valid_upto ? data.valid_upto.split('T')[0] : '',
                };
                setFormData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching card:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!user.id) {
            toast.error('Cannot save: User ID is missing. Please re-login.');
            return;
        }

        setSaving(true);
        try {
            await sqlApi.medicalCards.save(user.id, formData);
            toast.success('Medical card updated successfully');
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving card:', error);
            toast.error('Failed to save medical card');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !confirm('Are you sure you want to delete this medical card? This action cannot be undone.')) return;

        setSaving(true);
        try {
            await sqlApi.medicalCards.delete(user.id);
            toast.success('Medical card deleted successfully');
            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting card:', error);
            toast.error('Failed to delete medical card');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Manage Medical Card
                    </DialogTitle>
                    <DialogDescription>
                        Enter medical card details for {user.full_name} ({user.email}).
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="card_no">Card Number</Label>
                                <Input id="card_no" name="card_no" value={formData.card_no} onChange={handleInputChange} placeholder="e.g. MC-2024-001" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="participant_name">Participant Name</Label>
                                <Input id="participant_name" name="participant_name" value={formData.participant_name} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emp_no">Employee No</Label>
                                <Input id="emp_no" name="emp_no" value={formData.emp_no} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnic">CNIC / ID</Label>
                                <Input id="cnic" name="cnic" value={formData.cnic} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customer_no">Customer No</Label>
                                <Input id="customer_no" name="customer_no" value={formData.customer_no} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch</Label>
                                <Input id="branch" name="branch" value={formData.branch} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="valid_upto">Valid Upto</Label>
                                <Input id="valid_upto" name="valid_upto" type="date" value={formData.valid_upto} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="border-t border-border pt-4">
                            <h4 className="text-sm font-semibold mb-4 text-primary uppercase tracking-wider">Benefits Details (Back of Card)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hospitalization">Hospitalization</Label>
                                    <Input id="hospitalization" name="hospitalization" value={formData.hospitalization} onChange={handleInputChange} placeholder="e.g. Covered Up to 500k" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room_limit">Room Limit</Label>
                                    <Input id="room_limit" name="room_limit" value={formData.room_limit} onChange={handleInputChange} placeholder="e.g. Executive/Private" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="normal_delivery">Normal Delivery</Label>
                                    <Input id="normal_delivery" name="normal_delivery" value={formData.normal_delivery} onChange={handleInputChange} placeholder="e.g. 50,000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c_section_limit">C-Section Limit</Label>
                                    <Input id="c_section_limit" name="c_section_limit" value={formData.c_section_limit} onChange={handleInputChange} placeholder="e.g. 100,000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total_limit" className="text-primary font-bold">Annual Medical Limit (Rs.)</Label>
                                    <Input
                                        id="total_limit"
                                        name="total_limit"
                                        type="number"
                                        value={formData.total_limit}
                                        onChange={handleInputChange}
                                        placeholder="100,000"
                                        className="border-primary/50 bg-primary/5 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <Label htmlFor="benefit_covered">Benefit Covered (Overall Description)</Label>
                                <Textarea id="benefit_covered" name="benefit_covered" value={formData.benefit_covered} onChange={handleInputChange} placeholder="Describe overall coverage..." rows={3} />
                            </div>
                        </div>

                        <DialogFooter className="sticky bottom-0 bg-card pt-4 flex items-center justify-between gap-2 border-t border-border mt-4">
                            <div className="flex-1">
                                {formData.card_no && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                                        onClick={handleDelete}
                                        disabled={saving}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Card
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {formData.card_no ? 'Update Card' : 'Issue Card'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ManageCardDialog;
