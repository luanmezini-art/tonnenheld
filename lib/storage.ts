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
    const newBooking: Booking = {
        ...booking,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        status: 'Offen',
        paid: false,
        is_monthly: booking.is_monthly || false
    }

    if (supabase) {
        const { data, error } = await supabase.from('bookings').insert(newBooking).select().single()
        if (error) throw error
        return data
    }

    // Mock Mode
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
