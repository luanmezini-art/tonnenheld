"use client"

import { useState } from "react"
import { CalendarIcon, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createBooking, type ServiceScope, type BinType } from "@/lib/storage"
import { getNextDates, Street } from "@/lib/schedules"
import { cn } from "@/lib/utils"

export function BookingForm() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [showWarning, setShowWarning] = useState(true)
    const [formData, setFormData] = useState({
        name: "",
        street: "Hobergerfeld" as Street,
        houseNumber: "",
        date: "",
        binType: "Restmüll" as BinType,
        serviceScope: "Nur Rausstellen" as ServiceScope,
        isMonthly: false
    })

    // Simple validation state
    // We check if date is selected (which comes from valid list now)
    const isFormValid = formData.name && formData.houseNumber && formData.date

    const [validationError, setValidationError] = useState(false)

    // Derived state: Valid Dates
    const validDates = getNextDates(formData.street, formData.binType, 5)

    // Helper to calculate price
    const getPrice = (scope: ServiceScope, monthly: boolean) => {
        if (monthly) {
            if (scope === 'Raus & Rein') return 9.00
            return 5.00
        }
        if (scope === 'Raus & Rein') return 1.50
        return 1.00
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isFormValid) return

        // Deadline Validation
        const now = new Date()
        const serviceDate = new Date(formData.date)

        // Set deadline to 18:00 of the day BEFORE service date
        // Create a new date object based on service date
        const deadline = new Date(serviceDate)
        deadline.setDate(deadline.getDate() - 1)
        deadline.setHours(18, 0, 0, 0) // 18:00:00

        // Compare
        // Note: inputs are usually YYYY-MM-DD which parse to UTC midnight or local midnight depending on browser.
        // To be safe, let's work with local components or ensure consistent parsing.
        // '2024-12-18' checks.
        // Let's rely on standard comparison: if now > deadline, it's too late.

        if (now > deadline) {
            setValidationError(true)
            return
        }

        setLoading(true)
        try {
            const price = getPrice(formData.serviceScope, formData.isMonthly)
            await createBooking({
                customer_name: formData.name,
                customer_address: `${formData.street} ${formData.houseNumber}`,
                service_date: formData.date,
                bin_type: formData.binType,
                service_scope: formData.serviceScope,
                price: price,
                is_monthly: formData.isMonthly
            })

            // Send Notification (Fire and forget)
            fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    customerAddress: `${formData.street} ${formData.houseNumber}`,
                    binType: formData.binType,
                    serviceDate: new Date(formData.date).toLocaleDateString('de-DE'),
                    serviceScope: formData.serviceScope
                })
            }).catch(err => console.error("Failed to send notification:", err))

            setSuccess(true)
        } catch (error) {
            console.error("Booking failed:", error)
            alert("Fehler bei der Buchung. Bitte versuche es erneut.")
        } finally {
            setLoading(false)
        }
    }

    if (validationError) {
        return (
            <Card className="w-full max-w-md mx-auto border-red-500 bg-red-50">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                        <Trash2 className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-red-800">Buchung nicht möglich</CardTitle>
                    <CardDescription className="text-red-700 font-medium">
                        Die Frist ist leider abgelaufen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-red-800">
                    <p className="mb-4">
                        Für eine Abholung am <strong>{new Date(formData.date).toLocaleDateString('de-DE')}</strong> hättest du bis <strong>gestern 18:00 Uhr</strong> buchen müssen.
                    </p>
                    <p className="text-sm">Wir planen unsere Routen immer am Vorabend.</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button variant="outline" onClick={() => setValidationError(false)} className="bg-white border-red-200 hover:bg-red-100 text-red-700">
                        Anderes Datum wählen
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto border-green-500 bg-green-50">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-green-800">Buchung Erfolgreich!</CardTitle>
                    <CardDescription className="text-green-700">
                        Danke! Ich kümmere mich darum.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-green-800">
                    <p className="mb-2">Abholtermin: <strong>{new Date(formData.date).toLocaleDateString('de-DE')}</strong></p>
                    <p className="text-sm">Bezahlung erfolgt bar (Einwurf) oder nach Absprache.</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button variant="outline" onClick={() => setSuccess(false)} className="bg-white border-green-200 hover:bg-green-100 text-green-700">
                        Neue Buchung
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-primary" />
                    Müll-Service Buchen
                </CardTitle>
                <CardDescription>
                    Fülle das Formular aus, damit ich deine Tonne rausstelle.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Dein Name</label>
                        <Input
                            id="name"
                            placeholder="Max Mustermann"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-2">
                            <label htmlFor="street" className="text-sm font-medium">Straße</label>
                            <select
                                id="street"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value as Street, date: "" })}
                            >
                                <option value="Hobergerfeld">Hobergerfeld</option>
                                <option value="Kerkebrink">Kerkebrink</option>
                                <option value="Westfeld">Westfeld</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="houseNumber" className="text-sm font-medium">Nr.</label>
                            <Input
                                id="houseNumber"
                                placeholder=""
                                value={formData.houseNumber}
                                onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <label htmlFor="binType" className="text-sm font-medium">Welche Tonne?</label>
                            <select
                                id="binType"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.binType}
                                onChange={(e) => {
                                    setFormData({ ...formData, binType: e.target.value as BinType, date: "" })
                                }}
                            >
                                <option value="Restmüll">Restmüll (Schwarz)</option>
                                <option value="Papier">Papier (Blaue)</option>
                                <option value="Bio">Bio (Braun)</option>
                                <option value="Gelber Sack">Gelber Sack</option>
                            </select>
                        </div>

                        <select
                            id="date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        >
                            <option value="" disabled>Bitte Termin wählen</option>
                            {validDates.map((date) => (
                                <option key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                                    {date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">Wir zeigen dir nur die nächsten 5 gültigen Termine.</p>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">Termine ab Oktober 2026 werden im Spätsommer ergänzt.</p>
                    </div>


                    <div className="space-y-2">
                        <label className="text-sm font-medium">Was soll ich tun?</label>
                        <p className="text-[11px] text-amber-600/90 font-medium mb-2">Hinweis: Die Mülltonne muss gut erreichbar stehen.</p>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-accent">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="Nur Rausstellen"
                                    checked={formData.serviceScope === 'Nur Rausstellen'}
                                    onChange={() => setFormData({ ...formData, serviceScope: 'Nur Rausstellen' })}
                                    className="accent-primary"
                                />
                                <span className="text-sm">Nur Rausstellen ({getPrice('Nur Rausstellen', formData.isMonthly).toFixed(2).replace('.', ',')} €)</span>
                            </label>
                            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-accent">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="Nur Reinstellen"
                                    checked={formData.serviceScope === 'Nur Reinstellen'}
                                    onChange={() => setFormData({ ...formData, serviceScope: 'Nur Reinstellen' })}
                                    className="accent-primary"
                                />
                                <span className="text-sm">Nur Reinstellen ({getPrice('Nur Reinstellen', formData.isMonthly).toFixed(2).replace('.', ',')} €)</span>
                            </label>
                            <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-accent">
                                <input
                                    type="radio"
                                    name="scope"
                                    value="Raus & Rein"
                                    checked={formData.serviceScope === 'Raus & Rein'}
                                    onChange={() => setFormData({ ...formData, serviceScope: 'Raus & Rein' })}
                                    className="accent-primary"
                                />
                                <span className="text-sm">Raus & Rein ({getPrice('Raus & Rein', formData.isMonthly).toFixed(2).replace('.', ',')} €)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="monthly"
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                            checked={formData.isMonthly}
                            onChange={(e) => setFormData({ ...formData, isMonthly: e.target.checked })}
                        />
                        <label htmlFor="monthly" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Als dauerhaften <strong>Monatsauftrag</strong> buchen?
                        </label>
                        <span className="text-[10px] text-muted-foreground ml-2 bg-muted px-1.5 py-0.5 rounded">Wir kommen dann regelmäßig</span>
                    </div>

                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                        disabled={loading}
                    >
                        {loading ? "Wird gebucht..." : "Jetzt buchen"}
                    </Button>
                </CardFooter>
            </form>

            {/* Warning Modal */}
            {
                showWarning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-600">
                                    <CalendarIcon className="w-6 h-6" />
                                    Wichtiger Hinweis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    Bitte beachte, dass du deinen Auftrag bis spätestens <strong>18:00 Uhr</strong> am Tag <strong>vor der Abholung</strong> buchen musst.
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={() => setShowWarning(false)} className="w-full text-lg" size="lg">
                                    Alles klar, verstanden
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )
            }
        </Card >
    )
}
