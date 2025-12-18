import { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserCredits } from '../services/api'

type AuthContextType = {
    session: Session | null
    loading: boolean
    credits: number
    refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    loading: true,
    credits: 0,
    refreshCredits: async () => { }
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [credits, setCredits] = useState(0)

    const refreshCredits = async () => {
        if (!session?.user) return;
        const count = await fetchUserCredits();
        setCredits(count);
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("🔒 AuthProvider: Initial Session Check:", session?.user?.email || "No Session");
            setSession(session)
            setLoading(false)
            if (session?.user) {
                // Fetch initial credits
                fetchUserCredits().then(setCredits);
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("🔒 AuthProvider: Auth State Change:", _event, session?.user?.email || "No Session");
            setSession(session)
            if (session?.user) {
                fetchUserCredits().then(setCredits);
            } else {
                setCredits(0);
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ session, loading, credits, refreshCredits }}>
            {children}
        </AuthContext.Provider>
    )
}
