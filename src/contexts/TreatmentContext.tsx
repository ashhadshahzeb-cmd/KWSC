import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sqlApi, type TreatmentItem, type Employee, type TreatmentPayload } from '@/lib/api';

interface TreatmentContextType {
    // Employee/Session State
    employee: Employee | null;
    items: TreatmentItem[];
    currentStep: 'employee' | 'details' | 'summary';
    qrCode: string | null;
    labName?: string;
    hospitalName?: string;
    hospitalType?: 'OPD' | 'IPD';
    bookNo?: string;
    patientType?: string;
    patientNic?: string;
    reference?: string;
    vendor?: string;
    store?: string;
    invoiceNo?: string;
    description?: string;
    medicineAmount?: number;
    allowMonth?: string;
    treatmentType?: string;

    // Actions
    setEmployee: (emp: {
        empNo?: string;
        id?: string;
        name?: string;
        bookNo?: string;
        patientType?: string;
        patientNic?: string;
        reference?: string;
        vendor?: string;
    }) => Promise<boolean>;
    updateItem: (index: number, name: string, price: number) => void;
    clearSession: () => void;
    commitSession: (
        type: 'Medicine' | 'Lab' | 'Hospital' | 'NoteSheet',
        additionalData?: { labName?: string; hospitalName?: string; hospitalType?: 'OPD' | 'IPD' }
    ) => Promise<{ success: boolean; serialNo?: number; qrCode?: string; error?: string } | void>;
    goToDetailsStep: () => void;
    goBackToEmployee: () => void;
    setLabName: (name: string) => void;
    setHospitalName: (name: string) => void;
    setHospitalType: (type: 'OPD' | 'IPD') => void;
    setBookNo: (bookNo: string) => void;
    setPatientType: (type: string) => void;
    setPatientNic: (nic: string) => void;
    setReference: (ref: string) => void;
    setVendor: (vendor: string) => void;
    setStore: (store: string) => void;
    setInvoiceNo: (no: string) => void;
    setDescription: (desc: string) => void;
    setMedicineAmount: (amount: number) => void;
    setTreatmentType: (type: string) => void;
}

interface SessionData {
    employee: Employee | null;
    items: TreatmentItem[];
    currentStep: 'employee' | 'details' | 'summary';
    qrCode: string | null;
    labName?: string;
    hospitalName?: string;
    hospitalType?: 'OPD' | 'IPD';
    bookNo?: string;
    patientType?: string;
    patientNic?: string;
    reference?: string;
    vendor?: string;
    store?: string;
    invoiceNo?: string;
    description?: string;
    medicineAmount?: number;
    treatmentType?: string;
}

const TreatmentContext = createContext<TreatmentContextType | undefined>(undefined);

export const TreatmentProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<SessionData>({
        employee: null,
        items: Array(10).fill(null).map(() => ({ name: '', price: 0 })),
        currentStep: 'employee',
        qrCode: null,
        labName: '',
        hospitalName: '',
        hospitalType: 'OPD',
        bookNo: '',
        patientType: '',
        patientNic: '',
        reference: '',
        vendor: '',
        store: '',
        invoiceNo: '',
        description: '',
        medicineAmount: 0,
        treatmentType: 'Medicine',
    });
    const { toast } = useToast();

    // Validate employee and set cycle info
    const setEmployee = useCallback(async (emp: { empNo?: string; id?: string; name?: string }): Promise<boolean> => {
        try {
            const visitDate = new Date().toISOString().split('T')[0];
            const validation = await sqlApi.treatment.validateCycle(emp.empNo, visitDate, emp.id);

            if (!validation.allowed && !validation.valid) {
                toast({
                    title: 'Visit Restricted',
                    description: validation.message,
                    variant: 'destructive',
                });
                return false;
            }

            // Set employee with cycle info AND fetched details
            const validatedEmp = validation.employee || {};

            setSession(prev => ({
                ...prev,
                employee: {
                    id: (validatedEmp.id || emp.id || '').toString(),
                    empNo: (validatedEmp.empNo || emp.empNo || '').toString(),
                    name: validatedEmp.name || emp.name || 'Patient',
                    cycleNo: validation.cycleNo,
                    allowMonth: validation.allowMonth,
                    bookNo: validatedEmp.bookNo || '',
                    patientType: validatedEmp.patientType || 'Self',
                    patientNic: validatedEmp.patientNic || '',
                },
                allowMonth: validation.allowMonth,
                bookNo: validatedEmp.bookNo || '',
                patientType: validatedEmp.patientType || 'Self',
                patientNic: validatedEmp.patientNic || '',
            }));

            if (validation.employee) {
                toast({
                    title: 'Employee Found',
                    description: `${validatedEmp.name} (Cycle ${validation.cycleNo})`,
                });
            } else {
                toast({
                    title: 'New Record',
                    description: `Valid for Cycle ${validation.cycleNo}`,
                });
            }

            return true;
        } catch (error: any) {
            toast({
                title: 'Validation Failed',
                description: error.message,
                variant: 'destructive',
            });
            return false;
        }
    }, [toast]);

    const updateItem = useCallback((index: number, name: string, price: number) => {
        if (index < 0 || index >= 10) return;
        setSession(prev => {
            const newItems = [...prev.items];
            newItems[index] = { name, price };
            return { ...prev, items: newItems };
        });
    }, []);

    const clearSession = useCallback(() => {
        setSession({
            employee: null,
            items: Array(10).fill(null).map(() => ({ name: '', price: 0 })),
            currentStep: 'employee',
            qrCode: null,
            labName: '',
            hospitalName: '',
            hospitalType: 'OPD',
            bookNo: '',
            patientType: '',
            patientNic: '',
            reference: '',
            vendor: '',
            store: '',
            invoiceNo: '',
            description: '',
            medicineAmount: 0,
            treatmentType: 'Medicine',
        });
    }, []);

    const goToDetailsStep = useCallback(() => {
        setSession(prev => {
            if (!prev.employee) {
                toast({
                    title: 'Error',
                    description: 'Please enter employee details first',
                    variant: 'destructive',
                });
                return prev;
            }
            return { ...prev, currentStep: 'details' };
        });
    }, [toast]);

    const goBackToEmployee = useCallback(() => {
        setSession(prev => ({ ...prev, currentStep: 'employee' }));
    }, []);

    const setLabName = useCallback((name: string) => {
        setSession(prev => ({ ...prev, labName: name }));
    }, []);

    const setHospitalName = useCallback((name: string) => {
        setSession(prev => ({ ...prev, hospitalName: name }));
    }, []);

    const setHospitalType = useCallback((type: 'OPD' | 'IPD') => {
        setSession(prev => ({ ...prev, hospitalType: type }));
    }, []);

    const setBookNo = useCallback((bookNo: string) => {
        setSession(prev => ({ ...prev, bookNo }));
    }, []);

    const setPatientType = useCallback((type: string) => {
        setSession(prev => ({ ...prev, patientType: type }));
    }, []);

    const setPatientNic = useCallback((nic: string) => {
        setSession(prev => ({ ...prev, patientNic: nic }));
    }, []);

    const setReference = useCallback((ref: string) => {
        setSession(prev => ({ ...prev, reference: ref }));
    }, []);

    const setVendor = useCallback((vendor: string) => {
        setSession(prev => ({ ...prev, vendor: vendor }));
    }, []);

    const setStore = useCallback((store: string) => {
        setSession(prev => ({ ...prev, store }));
    }, []);

    const setInvoiceNo = useCallback((no: string) => {
        setSession(prev => ({ ...prev, invoiceNo: no }));
    }, []);

    const setDescription = useCallback((desc: string) => {
        setSession(prev => ({ ...prev, description: desc }));
    }, []);

    const setMedicineAmount = useCallback((amount: number) => {
        setSession(prev => ({ ...prev, medicineAmount: amount }));
    }, []);

    const setTreatmentType = useCallback((type: string) => {
        setSession(prev => ({ ...prev, treatmentType: type }));
    }, []);

    const commitSession = useCallback(async (
        treatmentType: 'Medicine' | 'Lab' | 'Hospital' | 'NoteSheet',
        additionalData?: { labName?: string; hospitalName?: string; hospitalType?: 'OPD' | 'IPD' }
    ) => {
        if (!session.employee) {
            toast({ title: 'Error', description: 'No employee selected', variant: 'destructive' });
            return;
        }

        // Filter out empty items
        const validItems = session.items.filter(item => item.name && item.name.trim() !== '');

        if (validItems.length === 0) {
            toast({
                title: 'Error',
                description: 'Please add at least one item',
                variant: 'destructive',
            });
            return;
        }

        try {
            const payload: TreatmentPayload = {
                treatmentType,
                employee: {
                    ...session.employee,
                    bookNo: session.bookNo || session.employee.bookNo,
                    patientType: session.patientType || session.employee.patientType,
                    patientNic: session.patientNic || session.employee.patientNic,
                    reference: session.reference || session.employee.reference,
                    vendor: session.vendor || session.employee.vendor,
                    store: session.store || session.employee.store,
                    invoiceNo: session.invoiceNo || session.employee.invoiceNo,
                    description: session.description || session.employee.description,
                    medicineAmount: session.medicineAmount || session.employee.medicineAmount,
                },
                items: validItems,
                labName: session.labName,
                hospitalName: session.hospitalName,
                hospitalType: session.hospitalType,
                store: session.store,
                invoiceNo: session.invoiceNo,
                description: session.description,
                medicineAmount: session.medicineAmount,
                ...additionalData,
            };

            const response = await sqlApi.treatment.commit(payload);

            setSession(prev => ({
                ...prev,
                qrCode: response.qrCode,
                currentStep: 'summary',
            }));

            toast({
                title: 'Success',
                description: `Treatment record saved successfully. Serial No: ${response.serialNo}`,
                className: 'bg-green-50',
            });

            return { success: true, serialNo: response.serialNo, qrCode: response.qrCode };
        } catch (error: any) {
            toast({
                title: 'Submission Failed',
                description: error.message,
                variant: 'destructive',
            });
            return { success: false, error: error.message };
        }
    }, [session.employee, session.items, session.bookNo, session.patientType, session.patientNic, session.reference, session.vendor, session.store, session.invoiceNo, session.description, session.medicineAmount, session.labName, session.hospitalName, session.hospitalType, toast]);

    const contextValue = useMemo(() => ({
        employee: session.employee,
        items: session.items,
        currentStep: session.currentStep,
        qrCode: session.qrCode,
        labName: session.labName,
        hospitalName: session.hospitalName,
        hospitalType: session.hospitalType,
        bookNo: session.bookNo,
        patientType: session.patientType,
        patientNic: session.patientNic,
        reference: session.reference,
        vendor: session.vendor,
        store: session.store,
        invoiceNo: session.invoiceNo,
        description: session.description,
        allowMonth: session.employee?.allowMonth,
        setEmployee,
        updateItem,
        clearSession,
        commitSession,
        goToDetailsStep,
        goBackToEmployee,
        setLabName,
        setHospitalName,
        setHospitalType,
        setBookNo,
        setPatientType,
        setPatientNic,
        setReference,
        setVendor,
        setStore,
        setInvoiceNo,
        setDescription,
        setMedicineAmount,
        setTreatmentType,
        treatmentType: session.treatmentType
    }), [
        session.employee,
        session.items,
        session.currentStep,
        session.qrCode,
        session.labName,
        session.hospitalName,
        session.hospitalType,
        session.bookNo,
        session.patientType,
        session.patientNic,
        session.reference,
        session.vendor,
        session.store,
        session.invoiceNo,
        session.description,
        session.treatmentType,
        setEmployee,
        updateItem,
        clearSession,
        commitSession,
        goToDetailsStep,
        goBackToEmployee,
        setLabName,
        setHospitalName,
        setHospitalType,
        setBookNo,
        setPatientType,
        setPatientNic,
        setReference,
        setVendor,
        setStore,
        setInvoiceNo,
        setDescription,
        setMedicineAmount,
        setTreatmentType
    ]);

    return (
        <TreatmentContext.Provider value={contextValue}>
            {children}
        </TreatmentContext.Provider>
    );
};

export const useTreatment = () => {
    const context = useContext(TreatmentContext);
    if (!context) throw new Error('useTreatment must be used within a TreatmentProvider');
    return context;
};
