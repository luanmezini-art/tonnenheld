import { supabase } from './supabase'

export type BookingStatus = 'Offen' | 'Erledigt'
export type BinType = 'Restmüll' | 'Papier' | 'Bio' | 'Gelber Sack'
export type ServiceScope = 'Nur Rausstellen' | 'Nur Reinstellen' | 'Raus & Rein'

export interface Booking {
    id: string
    created_at: string
    customer_name: string
    customer_address: string
    service_date: string
    bin_type: BinType
    service_scope: ServiceScope
    status: BookingStatus
    price: number
    paid?: boolean
    is_monthly?: boolean
}

// In-memory fallback for server-side rendering or when localStorage is unavailable
let memoryStore: Booking[] = []

// Helper to get bookings from "DB"
export async function getBookings(): Promise<Booking[]> {
    if (supabase) {
        const { data, error } = await supabase.from('bookings').select('*').order('service_date', { ascending: true })
        if (error) throw error
        return data as Booking[]
    }

    // Mock Mode
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('bookings')
        if (stored) return JSON.parse(stored)
    }
    return memoryStore
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>): Promise<Booking> {
    // 1. Prepare base data (without ID)
    const baseBooking = {
        ...booking,
        created_at: new Date().toISOString(),
        status: 'Offen' as BookingStatus,
        paid: false,
        is_monthly: booking.is_monthly || false
    }

    if (supabase) {
        // Just insert, don't select (since guests can't read the DB, selecting would fail)
        const { error } = await supabase.from('bookings').insert(baseBooking)
        if (error) throw error

        // Return optimistic object (ID is not needed for the success screen)
        return {
            ...baseBooking,
            id: 'temp-id-placeholder'
        } as Booking
    }

    // Mock Mode
    // Generate a simple compatible UUID-like string for mock mode (safe for all browsers)
    const mockId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    const newBooking: Booking = {
        ...baseBooking,
        id: mockId
    }

    if (typeof window !== 'undefined') {
        const current = await getBookings()
        const updated = [...current, newBooking]
        localStorage.setItem('bookings', JSON.stringify(updated))
    } else {
        memoryStore.push(newBooking)
    }

    // Simulate network delay
    await new Promise(r => setTimeout(r, 500))
    return newBooking
}

export async function deleteBooking(id: string): Promise<void> {
    if (supabase) {
        const { error } = await supabase.from('bookings').delete().eq('id', id)
        if (error) throw error
        return
    }

    // Mock Mode
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('bookings')
        if (stored) {
            const bookings: Booking[] = JSON.parse(stored)
            const updated = bookings.filter(b => b.id !== id)
            localStorage.setItem('bookings', JSON.stringify(updated))
        }
    }
    // Memory Store (fallback)
    const index = memoryStore.findIndex(b => b.id === id)
    if (index !== -1) memoryStore.splice(index, 1)
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
    if (supabase) {
        const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
        if (error) throw error
        return
    }

    // Mock Mode
    if (typeof window !== 'undefined') {
        const current = await getBookings()
        const updated = current.map(b => b.id === id ? { ...b, status } : b)
        localStorage.setItem('bookings', JSON.stringify(updated))
    }
}

export async function updateBookingPaid(id: string, paid: boolean): Promise<void> {
    if (supabase) {
        const { error } = await supabase.from('bookings').update({ paid }).eq('id', id)
        if (error) throw error
        return
    }

    // Mock Mode
    if (typeof window !== 'undefined') {
        const current = await getBookings()
        const updated = current.map(b => b.id === id ? { ...b, paid } : b)
        localStorage.setItem('bookings', JSON.stringify(updated))
    }
}
