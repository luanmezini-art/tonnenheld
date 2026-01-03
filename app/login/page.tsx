"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (supabase) {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                router.push("/admin")
            } else {
                // Mock Login
                if (email === "admin" && password === "admin") {
                    // Simple mock session
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('admin_session', 'true')
                    }
                    router.push("/admin")
                } else {
                    alert("Mock Login: Use user 'admin' and password 'admin'")
                }
            }
        } catch (error) {
            console.error(error)
            alert("Login fehlgeschlagen")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Admin Login</CardTitle>
                    <CardDescription>
                        Melde dich an, um die Aufträge zu verwalten.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input
                                id="email"
                                type="text" // Changed to text to allow simple 'admin' username in mock
                                placeholder="luis@tonnenheld.de"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password">Passwort</label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Wird angemeldet..." : "Anmelden"}
                        </Button>
                        {!supabase && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Mock Mode: admin / admin
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
