"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getBookings, updateBookingStatus, updateBookingPaid, type Booking } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, LogOut, Trash2, Coins, Euro, Star, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'open' | 'done'>('open')
    // --- SELECTION STATE (Moved up to fix Hooks error) ---
    const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null)

    const router = useRouter()

    useEffect(() => {
        checkAuthAndLoad()
    }, [])

    async function checkAuthAndLoad() {
        // Auth Check
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
        } else {
            // Mock Auth Check
            if (typeof window !== 'undefined' && !localStorage.getItem('admin_session')) {
                router.push("/login")
                return
            }
        }

        // Load Data
        try {
            const data = await getBookings()
            setBookings(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        if (supabase) await supabase.auth.signOut()
        else localStorage.removeItem('admin_session')
        router.push("/login")
    }

    const handleMarkAsDone = async (id: string) => {
        try {
            await updateBookingStatus(id, 'Erledigt')
            setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Erledigt' } : b))
        } catch (e) {
            console.error(e)
            alert("Fehler beim Aktualisieren")
        }
    }

    const handleTogglePaid = async (id: string, currentPaid: boolean | undefined) => {
        const newPaid = !currentPaid
        try {
            await updateBookingPaid(id, newPaid)
            setBookings(bookings.map(b => b.id === id ? { ...b, paid: newPaid } : b))
        } catch (e) {
            console.error(e)
            alert("Fehler beim Aktualisieren")
        }
    }

    // --- LOYALTY CALCULATION & CUSTOMER GROUPING ---
    // 1. Group bookings by NORMALIZED customer (Name + Address)
    // Key format: "name|address" (lowercase)
    const bookingsByCustomer: Record<string, Booking[]> = {}

    // Helper for normalization
    const normalize = (s: string) => s.trim().toLowerCase()

    bookings.forEach(b => {
        const key = `${normalize(b.customer_name)}|${normalize(b.customer_address)}`
        if (!bookingsByCustomer[key]) bookingsByCustomer[key] = []
        bookingsByCustomer[key].push(b)
    })

    // Identify which booking IDs are "free" (every 6th per customer)
    const freeBookingIds = new Set<string>()

    // 2. Sort by date and pick every 6th
    Object.values(bookingsByCustomer).forEach(customerBookings => {
        // Sort oldest to newest
        customerBookings.sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())

        customerBookings.forEach((b, index) => {
            // (index + 1) % 6 === 0
            if ((index + 1) % 6 === 0) {
                freeBookingIds.add(b.id)
            }
        })
    })

    // --- DERIVED STATE ---
    if (loading) return <div className="flex bg-muted/20 h-screen items-center justify-center">Lade Daten...</div>

    const openBookings = bookings.filter(b => b.status === "Offen")
    const completedBookings = bookings.filter(b => b.status === "Erledigt")

    // Calculate Earnings
    const earnings = completedBookings.reduce((sum, b) => {
        if (freeBookingIds.has(b.id)) return sum
        return sum + (b.price || 0)
    }, 0)

    const paidEarnings = completedBookings.filter(b => b.paid).reduce((sum, b) => {
        if (freeBookingIds.has(b.id)) return sum
        return sum + (b.price || 0)
    }, 0)

    const openEarnings = earnings - paidEarnings

    // Filter Logic: Hide Paid from Main Lists
    const displayedBookings = bookings
        .filter(b => {
            if (b.paid && filter !== 'all') return false
            if (filter === 'open') return b.status === 'Offen'
            if (filter === 'done') return b.status === 'Erledigt'
            return true
        })
        .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())

    // Loyalty Table Customers
    const customerStats = Object.values(bookingsByCustomer).map(customerBookings => {
        // Use the most recent name/address casing for display
        // (Sort by date descending to get latest)
        const sorted = [...customerBookings].sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())
        const latest = sorted[0]

        const count = customerBookings.length
        const paidCount = customerBookings.filter(b => b.paid).length
        const freeCount = Math.floor(count / 6)
        // Next free is at?
        const nextFreeAt = (freeCount + 1) * 6
        const ordersNeeded = nextFreeAt - count

        return {
            key: `${normalize(latest.customer_name)}|${normalize(latest.customer_address)}`, // Store key to identify
            name: latest.customer_name,
            address: latest.customer_address,
            bookings: customerBookings, // Pass full array for modal
            count,
            paid: paidCount,
            freeSent: freeCount,
            ordersNeeded
        }
    }).sort((a, b) => b.count - a.count)

    // --- SELECTION STATE ---
    // Hook was moved up.
    // Derive selected customer from stats
    const selectedCustomer = customerStats.find(c => c.key === selectedCustomerKey)


    return (
        <div className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
                    <Button variant="ghost" onClick={handleLogout} className="gap-2">
                        <LogOut className="w-4 h-4" /> Abmelden
                    </Button>
                </div>

                {/* Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Offen (Arbeit)</CardTitle>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{openBookings.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Erledigt</CardTitle>
                            <Check className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedBookings.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bezahlt</CardTitle>
                            <Coins className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{paidEarnings.toFixed(2)} €</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Offen (Geld)</CardTitle>
                            <Euro className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{openEarnings.toFixed(2)} €</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: Job Lists */}
                    <div className="xl:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2">
                            <Button variant={filter === 'open' ? 'default' : 'outline'} onClick={() => setFilter('open')}>Offene Aufträge (Unbezahlt)</Button>
                            <Button variant={filter === 'done' ? 'default' : 'outline'} onClick={() => setFilter('done')}>Erledigt (Unbezahlt)</Button>
                            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Alle (Inkl. Bezahlt)</Button>
                        </div>

                        {/* Job List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{filter === 'open' ? 'Offene Aufträge' : filter === 'done' ? 'Erledigte Aufträge' : 'Gesamtarchiv'}</CardTitle>
                                <CardDescription>
                                    {filter !== 'all' ? "Zeigt nur unbezahlte Aufträge." : "Zeigt alle Aufträge, auch bezahlte."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {displayedBookings.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">Keine Einträge gefunden.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {displayedBookings.map((booking) => {
                                            const isGratis = freeBookingIds.has(booking.id)
                                            return (
                                                <div key={booking.id} className={cn("flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg shadow-sm gap-4 transition-colors", booking.status === 'Erledigt' ? 'bg-muted/40' : 'bg-background')}>
                                                    <div className="space-y-1">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {booking.customer_name}
                                                            <span className={cn("text-xs px-2 py-0.5 rounded-full border",
                                                                booking.bin_type === 'Restmüll' && "bg-gray-100 border-gray-400",
                                                                booking.bin_type === 'Papier' && "bg-blue-50 border-blue-200 text-blue-700",
                                                                booking.bin_type === 'Bio' && "bg-amber-50 border-amber-200 text-amber-700",
                                                                booking.bin_type === 'Gelber Sack' && "bg-yellow-50 border-yellow-200 text-yellow-700",
                                                            )}>
                                                                {booking.bin_type}
                                                            </span>
                                                            {booking.status === 'Erledigt' && <span className="text-xs text-green-600 font-bold border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">Erledigt</span>}
                                                            {booking.paid && <span className="text-xs text-green-600 font-bold border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">Bezahlt</span>}
                                                            {booking.is_monthly && <span className="text-xs text-blue-600 font-bold border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-full">ABO</span>}
                                                            {isGratis && <span className="text-xs text-white font-bold bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded-full flex items-center gap-1"><Gift className="w-3 h-3" /> GRATIS</span>}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{booking.customer_address}</div>
                                                    </div>

                                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                        <div className="text-right">
                                                            <div className="font-medium">{new Date(booking.service_date).toLocaleDateString('de-DE')}</div>
                                                            <div className={cn("text-xs", isGratis ? "text-purple-600 font-bold" : "text-muted-foreground")}>
                                                                {booking.service_scope}
                                                                {isGratis ? " (0,00 €)" : ` (${booking.price.toFixed(2)} €)`}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => handleTogglePaid(booking.id, booking.paid)}
                                                                variant={booking.paid ? "outline" : "destructive"}
                                                                size="sm"
                                                                className={cn("transition-all",
                                                                    booking.paid
                                                                        ? "border-green-500 text-green-600 bg-green-50 border-dashed"
                                                                        : "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                                                )}
                                                                title="Zahlungsstatus ändern"
                                                            >
                                                                <Coins className="w-4 h-4 mr-1" />
                                                                {booking.paid ? "Bezahlt" : "Nicht bezahlt"}
                                                            </Button>

                                                            <Button
                                                                onClick={async () => {
                                                                    if (confirm("Möchtest du diesen Auftrag wirklich löschen?")) {
                                                                        try {
                                                                            const { deleteBooking } = await import("@/lib/storage")
                                                                            await deleteBooking(booking.id)
                                                                            // Refresh
                                                                            await checkAuthAndLoad()
                                                                        } catch (e) {
                                                                            alert("Fehler beim Löschen: " + e)
                                                                        }
                                                                    }
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                                                title="Auftrag löschen"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>

                                                            {booking.status === 'Offen' && (
                                                                <Button onClick={() => handleMarkAsDone(booking.id)} size="sm" className="bg-green-600 hover:bg-green-700">
                                                                    <Check className="w-4 h-4 mr-1" /> Fertig
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Loyalty Table */}
                    <div className="xl:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader className="bg-amber-50 rounded-t-lg border-b border-amber-100">
                                <CardTitle className="flex items-center gap-2 text-amber-800">
                                    <Star className="w-5 h-5 fill-amber-500 text-amber-600" />
                                    Kunden & Gratis-Status
                                </CardTitle>
                                <CardDescription className="text-amber-700">
                                    Klicke einen Kunden an für Details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative w-full overflow-auto max-h-[calc(100vh-300px)]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-amber-100/50 text-amber-900 font-medium border-b border-amber-100 sticky top-0 bg-white shadow-sm z-10">
                                            <tr>
                                                <th className="p-3">Kunde</th>
                                                <th className="p-3 text-center">Gesamt</th>
                                                <th className="p-3 text-center">Gratis</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-100/50">
                                            {customerStats.length === 0 ? (
                                                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Noch keine Kunden</td></tr>
                                            ) : (
                                                customerStats.map((customer, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-amber-50 cursor-pointer transition-colors"
                                                        onClick={() => setSelectedCustomerKey(customer.key)}
                                                    >
                                                        <td className="p-3">
                                                            <div className="font-medium text-amber-950">{customer.name}</div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">{customer.address}</div>
                                                            {customer.count % 6 !== 0 && (
                                                                <div className="text-[10px] text-amber-600 mt-1">
                                                                    Noch <b>{customer.ordersNeeded}</b> bis Gratis
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center align-top pt-3">
                                                            <span className="font-semibold text-lg">{customer.count}</span>
                                                        </td>
                                                        <td className="p-3 text-center align-top pt-3">
                                                            {customer.freeSent > 0 ? (
                                                                <div className="flex flex-col items-center">
                                                                    <span className="font-bold text-green-600 text-lg">{customer.freeSent}x</span>
                                                                    <span className="text-[10px] text-green-700 bg-green-100 px-1.5 rounded-full">Erhalten</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* CUSTOMER DETAIL MODAL */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
                        <CardHeader className="bg-primary/5 border-b flex-shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{selectedCustomer.name}</CardTitle>
                                    <CardDescription className="text-lg">{selectedCustomer.address}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomerKey(null)}>
                                    <LogOut className="w-5 h-5 rotate-180" /> {/* Hacky close icon */}
                                </Button>
                            </div>
                            <div className="flex gap-4 mt-4 text-sm">
                                <div className="bg-white px-3 py-1.5 rounded border shadow-sm">
                                    <span className="text-muted-foreground block text-xs">Gesamtaufträge</span>
                                    <span className="font-bold text-lg">{selectedCustomer.count}</span>
                                </div>
                                <div className="bg-white px-3 py-1.5 rounded border shadow-sm">
                                    <span className="text-muted-foreground block text-xs">Gratis Erhalten</span>
                                    <span className="font-bold text-lg text-green-600">{selectedCustomer.freeSent}</span>
                                </div>
                                <div className="bg-white px-3 py-1.5 rounded border shadow-sm">
                                    <span className="text-muted-foreground block text-xs">Bezahlt</span>
                                    <span className="font-bold text-lg text-blue-600">{selectedCustomer.paid}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-auto p-0 flex-1">
                            <div className="p-6 space-y-4">
                                <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Auftragshistorie
                                </h3>
                                <div className="space-y-2">
                                    {selectedCustomer.bookings.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()).map(booking => {
                                        const isGratis = freeBookingIds.has(booking.id)
                                        return (
                                            <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-2 h-10 rounded-full",
                                                        booking.bin_type === 'Restmüll' && "bg-gray-800",
                                                        booking.bin_type === 'Papier' && "bg-blue-600",
                                                        booking.bin_type === 'Bio' && "bg-amber-600",
                                                        booking.bin_type === 'Gelber Sack' && "bg-yellow-500",
                                                    )} />
                                                    <div>
                                                        <div className="font-medium">
                                                            {new Date(booking.service_date).toLocaleDateString('de-DE')}
                                                            {isGratis && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">GRATIS</span>}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {booking.bin_type} • {booking.service_scope}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className={cn("text-xs px-2 py-0.5 rounded-full border",
                                                        booking.status === 'Erledigt' ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"
                                                    )}>
                                                        {booking.status}
                                                    </div>
                                                    {booking.paid && <div className="text-[10px] text-green-600 font-semibold">Bezahlt</div>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

